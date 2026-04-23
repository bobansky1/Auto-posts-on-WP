# Design Document: web-ui

## Overview

The web UI adds a browser-based interface on top of the existing `ArticlePipeline`. It is composed of two new pieces:

- `web/backend/api.py` — a FastAPI application that accepts all pipeline configuration in a single POST request body, constructs the necessary objects, and delegates to the existing pipeline.
- `web/frontend/` — a React 18 + Vite + TypeScript single-page application styled with Tailwind CSS that renders the form, manages loading/success/error states, and sends the request to the backend.

No changes are made to `src/ai_article_generator/`. The backend imports from it directly.

---

## Architecture

```
Browser
  └── React SPA (Vite dev server :5173 / static build)
        │  POST /api/generate  (JSON)
        ▼
  FastAPI (uvicorn :8000)
        │  constructs Config + PipelineInput
        ▼
  ArticlePipeline  (existing src/ai_article_generator/)
        ├── TextGenerator  → Gemini API
        ├── ImageGenerator → Pollinations.ai
        └── WordPressClient → WordPress REST API
```

During development the Vite dev server proxies `/api/*` to `http://localhost:8000` so the frontend never needs to know the backend port. In production the FastAPI app can serve the built static files directly.

---

## Components and Interfaces

### Backend: `web/backend/api.py`

**Pydantic models**

```python
class GenerateRequest(BaseModel):
    prompt: str
    wp_url: str
    wp_username: str
    wp_app_password: str
    gemini_api_key: str
    publish_at: Optional[str] = None        # ISO 8601 string
    categories: list[int] = []
    tags: list[str] = []
    image_count: Literal[2, 3] = 2

class GenerateResponse(BaseModel):
    post_url: str
    status: str                             # "publish" | "future"

class ErrorResponse(BaseModel):
    error: str
```

**Endpoint**

```
POST /api/generate
  Body:  GenerateRequest
  200:   GenerateResponse
  401:   ErrorResponse   (WordPressAuthError)
  422:   ErrorResponse   (ValidationError, Pydantic validation)
  500:   ErrorResponse   (unexpected)
  502:   ErrorResponse   (TextGenerationError, ImageGenerationError, WordPressError)
```

**CORS** — `CORSMiddleware` allows `http://localhost:5173` (Vite dev origin) during development. In production the allowed origin is the domain serving the frontend.

**Error mapping**

| Exception class          | HTTP status |
|--------------------------|-------------|
| `ValidationError`        | 422         |
| `WordPressAuthError`     | 401         |
| `TextGenerationError`    | 502         |
| `ImageGenerationError`   | 502         |
| `WordPressError`         | 502         |
| `Exception` (catch-all)  | 500         |

### Frontend: `web/frontend/src/`

```
App.tsx                  root component, renders <ArticleForm />
components/
  ArticleForm.tsx        form state, validation, submission logic
  ResultPanel.tsx        success display (post_url link + status)
  ErrorPanel.tsx         error message display
  LoadingOverlay.tsx     spinner + "this may take 30–60 seconds" message
types.ts                 TypeScript interfaces mirroring backend models
api.ts                   fetch wrapper for POST /api/generate
```

**Form state** is managed with `useState` hooks inside `ArticleForm`. No external state library is needed given the simplicity of the form.

**Submission flow**

1. `handleSubmit` runs client-side validation; aborts with field errors if invalid.
2. Sets `loading = true`, disables the submit button.
3. Calls `api.generate(formData)` (fetch POST to `/api/generate`).
4. On success: sets `result`, clears `error`, sets `loading = false`.
5. On failure: sets `error` message, clears `result`, sets `loading = false`.

---

## Data Models

### `GenerateRequest` (TypeScript mirror)

```typescript
interface GenerateRequest {
  prompt: string;
  wp_url: string;
  wp_username: string;
  wp_app_password: string;
  gemini_api_key: string;
  publish_at?: string;          // ISO 8601 or undefined
  categories?: number[];
  tags?: string[];
  image_count?: 2 | 3;
}
```

### `GenerateResponse`

```typescript
interface GenerateResponse {
  post_url: string;
  status: string;
}
```

### `ErrorResponse`

```typescript
interface ErrorResponse {
  error: string;
}
```

### Frontend form state

```typescript
interface FormState {
  prompt: string;
  wp_url: string;
  wp_username: string;
  wp_app_password: string;
  gemini_api_key: string;
  publish_at: string;       // raw input; parsed before sending
  categories: string;       // raw comma-separated input
  tags: string;             // raw comma-separated input
  image_count: 2 | 3;
}

interface FormErrors {
  prompt?: string;
  wp_url?: string;
  wp_username?: string;
  wp_app_password?: string;
  gemini_api_key?: string;
  publish_at?: string;
  categories?: string;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Given the user's direction that this is a thin wrapper with no property-based tests needed, the correctness properties below are expressed as unit-testable examples rather than universally quantified properties. They cover the backend endpoint's error-mapping logic, which is the only non-trivial logic in the system.

**Property 1: Required-field rejection**
For any `GenerateRequest` body missing one or more required fields (`prompt`, `wp_url`, `wp_username`, `wp_app_password`, `gemini_api_key`), the API SHALL return HTTP 422.
**Validates: Requirements 8.1–8.5**

**Property 2: Invalid `image_count` rejection**
For any `GenerateRequest` body where `image_count` is not 2 or 3, the API SHALL return HTTP 422.
**Validates: Requirements 8.10**

**Property 3: Pipeline success maps to HTTP 200**
When the Pipeline returns a `PublishResult`, the API SHALL return HTTP 200 with `post_url` and `status` matching the result.
**Validates: Requirements 7.3**

**Property 4: Auth error maps to HTTP 401**
When the Pipeline raises `WordPressAuthError`, the API SHALL return HTTP 401 with a non-empty `error` string.
**Validates: Requirements 7.5**

**Property 5: Known pipeline errors map to HTTP 502**
When the Pipeline raises `TextGenerationError`, `ImageGenerationError`, or `WordPressError`, the API SHALL return HTTP 502 with a non-empty `error` string.
**Validates: Requirements 7.6**

**Property 6: Unexpected errors map to HTTP 500**
When the Pipeline raises an unexpected `Exception`, the API SHALL return HTTP 500 with a non-empty `error` string.
**Validates: Requirements 7.7**

---

## Error Handling

**Backend**

- Each known exception class from the pipeline is caught individually and mapped to the appropriate HTTP status code (see error mapping table above).
- A final `except Exception` catch-all returns 500 to prevent unhandled exceptions from leaking stack traces to the client.
- Pydantic's built-in validation handles malformed request bodies (missing required fields, wrong types, invalid `image_count`) and returns 422 automatically.

**Frontend**

- Client-side validation runs before the fetch call; field-level error messages are shown inline beneath each input.
- `fetch` errors (network failure, DNS failure) are caught and surfaced as a generic "Network error — please check your connection" message.
- Non-2xx responses are parsed as `ErrorResponse` and the `error` field is displayed.
- The submit button is always re-enabled after the request settles (success or failure).

---

## Testing Strategy

**Backend unit tests** (`web/backend/tests/test_api.py`)

Use `pytest` with `httpx.AsyncClient` and `unittest.mock.patch` to mock `ArticlePipeline.run`. Tests cover:

- Happy path: mocked pipeline returns `PublishResult` → assert HTTP 200 + correct body.
- Missing required fields → assert HTTP 422.
- Invalid `image_count` → assert HTTP 422.
- `WordPressAuthError` → assert HTTP 401.
- `TextGenerationError` → assert HTTP 502.
- `ImageGenerationError` → assert HTTP 502.
- `WordPressError` → assert HTTP 502.
- Unexpected `Exception` → assert HTTP 500.

No property-based tests are used for this feature per the project's direction. The backend logic is a thin mapping layer; exhaustive example-based tests provide sufficient coverage.

**Frontend**

Manual smoke testing via the Vite dev server is sufficient for this thin UI layer. No automated frontend tests are included in the initial implementation.

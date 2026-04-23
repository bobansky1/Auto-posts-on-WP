# Requirements Document

## Introduction

A browser-based interface for the AI Article Generator that lets users fill in a form, trigger the generation and publishing pipeline, and see the result — all without touching the CLI or a `.env` file. The web UI consists of a React + Vite frontend and a FastAPI backend that wraps the existing `ArticlePipeline`.

## Glossary

- **UI**: The React + Vite frontend served in the browser.
- **API**: The FastAPI backend at `web/backend/api.py`.
- **Pipeline**: The existing `ArticlePipeline` in `src/ai_article_generator/pipeline.py`.
- **GenerateRequest**: The JSON body sent from the UI to the API containing all form fields.
- **GenerateResponse**: The JSON body returned by the API on success, containing `post_url` and `status`.
- **ErrorResponse**: The JSON body returned by the API on failure, containing an `error` message string.
- **Credentials**: The set of sensitive fields — `wp_url`, `wp_username`, `wp_app_password`, `gemini_api_key`.

---

## Requirements

### Requirement 1: Form Fields

**User Story:** As a user, I want to fill in all necessary configuration and content fields in a single form, so that I can generate and publish an article without editing any files.

#### Acceptance Criteria

1. THE UI SHALL render a text area for `prompt` (required).
2. THE UI SHALL render a text input for `wp_url` (required).
3. THE UI SHALL render a text input for `wp_username` (required).
4. THE UI SHALL render a password input for `wp_app_password` (required).
5. THE UI SHALL render a password input for `gemini_api_key` (required).
6. THE UI SHALL render a text input for `publish_at` (optional, ISO 8601 format hint).
7. THE UI SHALL render a text input for `categories` (optional, comma-separated integers).
8. THE UI SHALL render a text input for `tags` (optional, comma-separated strings).
9. THE UI SHALL render a select or radio control for `image_count` with options 2 and 3, defaulting to 2.

---

### Requirement 2: Form Validation

**User Story:** As a user, I want the form to catch obvious mistakes before submission, so that I don't waste time waiting for a preventable error.

#### Acceptance Criteria

1. WHEN a user attempts to submit the form with `prompt` empty, THE UI SHALL prevent submission and display a validation message for that field.
2. WHEN a user attempts to submit the form with `wp_url` empty, THE UI SHALL prevent submission and display a validation message for that field.
3. WHEN a user attempts to submit the form with `wp_username` empty, THE UI SHALL prevent submission and display a validation message for that field.
4. WHEN a user attempts to submit the form with `wp_app_password` empty, THE UI SHALL prevent submission and display a validation message for that field.
5. WHEN a user attempts to submit the form with `gemini_api_key` empty, THE UI SHALL prevent submission and display a validation message for that field.
6. WHEN a user provides a non-empty `publish_at` value that is not a valid ISO 8601 datetime string, THE UI SHALL prevent submission and display a validation message for that field.
7. WHEN a user provides a non-empty `categories` value containing a token that is not a valid integer, THE UI SHALL prevent submission and display a validation message for that field.

---

### Requirement 3: Submission and Loading State

**User Story:** As a user, I want clear feedback while the article is being generated, so that I know the system is working and don't accidentally submit twice.

#### Acceptance Criteria

1. WHEN a user clicks the "Generate & Publish" button with all required fields valid, THE UI SHALL send a POST request to the API endpoint `/api/generate` with a `GenerateRequest` JSON body.
2. WHILE the API request is in flight, THE UI SHALL display a loading indicator.
3. WHILE the API request is in flight, THE UI SHALL disable the "Generate & Publish" button.
4. WHILE the API request is in flight, THE UI SHALL display a message informing the user that generation may take 30–60 seconds.

---

### Requirement 4: Success Display

**User Story:** As a user, I want to see the published post URL and status after a successful run, so that I can navigate to the article immediately.

#### Acceptance Criteria

1. WHEN the API returns a successful `GenerateResponse`, THE UI SHALL display the `post_url` as a clickable link.
2. WHEN the API returns a successful `GenerateResponse`, THE UI SHALL display the `status` value.
3. WHEN the API returns a successful `GenerateResponse`, THE UI SHALL re-enable the "Generate & Publish" button.

---

### Requirement 5: Error Display

**User Story:** As a user, I want to see a clear error message when something goes wrong, so that I can understand what failed and try again.

#### Acceptance Criteria

1. WHEN the API returns an `ErrorResponse`, THE UI SHALL display the `error` message to the user.
2. WHEN a network error occurs before the API responds, THE UI SHALL display a user-readable error message.
3. WHEN an error is displayed, THE UI SHALL re-enable the "Generate & Publish" button so the user can retry.

---

### Requirement 6: Credential Security

**User Story:** As a user, I want my credentials to remain in memory only for the duration of the request, so that they are not exposed through browser storage mechanisms.

#### Acceptance Criteria

1. THE UI SHALL NOT write `wp_app_password` to `localStorage`, `sessionStorage`, or any cookie.
2. THE UI SHALL NOT write `gemini_api_key` to `localStorage`, `sessionStorage`, or any cookie.
3. THE UI SHALL NOT write `wp_username` to `localStorage`, `sessionStorage`, or any cookie.
4. THE UI SHALL NOT write `wp_url` to `localStorage`, `sessionStorage`, or any cookie.

---

### Requirement 7: FastAPI Backend Endpoint

**User Story:** As a developer, I want a single FastAPI endpoint that accepts all pipeline configuration in the request body, so that no server-side `.env` file is required for the web UI path.

#### Acceptance Criteria

1. THE API SHALL expose a `POST /api/generate` endpoint.
2. WHEN the API receives a valid `GenerateRequest`, THE API SHALL construct a `Config` and `PipelineInput` from the request body and invoke the Pipeline.
3. WHEN the Pipeline completes successfully, THE API SHALL return a `GenerateResponse` with HTTP 200 containing `post_url` and `status`.
4. WHEN the Pipeline raises a validation error, THE API SHALL return an `ErrorResponse` with HTTP 422 containing a descriptive `error` message.
5. WHEN the Pipeline raises an authentication error, THE API SHALL return an `ErrorResponse` with HTTP 401 containing a descriptive `error` message.
6. WHEN the Pipeline raises any other known error (text generation, image generation, WordPress), THE API SHALL return an `ErrorResponse` with HTTP 502 containing a descriptive `error` message.
7. IF an unexpected exception occurs, THEN THE API SHALL return an `ErrorResponse` with HTTP 500 containing a generic `error` message.
8. THE API SHALL enable CORS for the frontend origin during development.

---

### Requirement 8: Request Body Schema

**User Story:** As a developer, I want a well-defined request schema, so that the frontend and backend stay in sync.

#### Acceptance Criteria

1. THE API SHALL accept `prompt` as a required non-empty string in the request body.
2. THE API SHALL accept `wp_url` as a required non-empty string in the request body.
3. THE API SHALL accept `wp_username` as a required non-empty string in the request body.
4. THE API SHALL accept `wp_app_password` as a required non-empty string in the request body.
5. THE API SHALL accept `gemini_api_key` as a required non-empty string in the request body.
6. THE API SHALL accept `publish_at` as an optional ISO 8601 datetime string in the request body, defaulting to `null`.
7. THE API SHALL accept `categories` as an optional list of integers in the request body, defaulting to an empty list.
8. THE API SHALL accept `tags` as an optional list of strings in the request body, defaulting to an empty list.
9. THE API SHALL accept `image_count` as an optional integer (2 or 3) in the request body, defaulting to 2.
10. WHEN `image_count` is provided with a value other than 2 or 3, THE API SHALL return HTTP 422.

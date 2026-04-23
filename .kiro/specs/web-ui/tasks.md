# Implementation Plan: web-ui

## Overview

Build the FastAPI backend and React + Vite + TypeScript frontend incrementally. The backend is implemented and tested first, then the frontend is wired to it.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create `web/backend/` with `api.py`, `__init__.py`, and `requirements.txt` (fastapi, uvicorn, httpx for tests, pytest, pytest-asyncio)
  - Create `web/frontend/` by scaffolding a Vite + React + TypeScript project (`npm create vite@latest frontend -- --template react-ts`)
  - Add Tailwind CSS to the frontend (`npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`)
  - Configure Vite proxy: add `server.proxy` in `vite.config.ts` to forward `/api` to `http://localhost:8000`
  - _Requirements: 7.1, 7.8_

- [x] 2. Implement FastAPI backend
  - [x] 2.1 Define Pydantic models and the `/api/generate` endpoint in `web/backend/api.py`
    - Implement `GenerateRequest`, `GenerateResponse`, `ErrorResponse` Pydantic models
    - Implement `POST /api/generate` handler: parse request, build `Config` + `PipelineInput`, call `ArticlePipeline.run`, return `GenerateResponse`
    - Add `CORSMiddleware` allowing `http://localhost:5173`
    - Map each exception class to the correct HTTP status per the design error table
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 8.1–8.10_

  - [x] 2.2 Write unit tests for the `/api/generate` endpoint
    - Create `web/backend/tests/test_api.py`
    - Mock `ArticlePipeline.run` using `unittest.mock.patch`
    - Test happy path → HTTP 200 with correct `post_url` and `status`
    - Test missing required fields → HTTP 422
    - Test `image_count` not in [2, 3] → HTTP 422
    - Test `WordPressAuthError` → HTTP 401
    - Test `TextGenerationError` → HTTP 502
    - Test `ImageGenerationError` → HTTP 502
    - Test `WordPressError` → HTTP 502
    - Test unexpected `Exception` → HTTP 500
    - _Requirements: 7.3, 7.4, 7.5, 7.6, 7.7, 8.1–8.5, 8.10_

- [x] 3. Checkpoint — backend tests pass
  - Ensure all tests in `web/backend/tests/` pass. Ask the user if questions arise.

- [x] 4. Implement frontend types and API client
  - [x] 4.1 Create `web/frontend/src/types.ts` with `GenerateRequest`, `GenerateResponse`, `ErrorResponse` TypeScript interfaces
    - _Requirements: 8.1–8.10_
  - [x] 4.2 Create `web/frontend/src/api.ts` with a `generate(req: GenerateRequest): Promise<GenerateResponse>` function
    - Use `fetch` to POST to `/api/generate`
    - Throw an `Error` with the `error` field on non-2xx responses
    - Throw a network error message on fetch failure
    - _Requirements: 3.1, 5.2_

- [x] 5. Implement React components
  - [x] 5.1 Create `web/frontend/src/components/ArticleForm.tsx`
    - Manage `FormState` and `FormErrors` with `useState`
    - Render all nine form fields (Requirement 1) with Tailwind styling
    - Run client-side validation on submit (Requirements 2.1–2.7)
    - Call `api.generate()`, set loading state, handle success and error (Requirements 3, 4, 5)
    - Never write any credential field to localStorage, sessionStorage, or cookies (Requirement 6)
    - _Requirements: 1.1–1.9, 2.1–2.7, 3.1–3.4, 4.1–4.3, 5.1–5.3, 6.1–6.4_

  - [x] 5.2 Create `web/frontend/src/components/LoadingOverlay.tsx`
    - Display a spinner and the message "Generating article — this may take 30–60 seconds…"
    - _Requirements: 3.2, 3.4_

  - [x] 5.3 Create `web/frontend/src/components/ResultPanel.tsx`
    - Display `post_url` as a clickable `<a>` link and the `status` value
    - _Requirements: 4.1, 4.2_

  - [x] 5.4 Create `web/frontend/src/components/ErrorPanel.tsx`
    - Display the error message string
    - _Requirements: 5.1, 5.2_

  - [x] 5.5 Wire everything together in `web/frontend/src/App.tsx`
    - Render `<ArticleForm />` as the sole page content
    - _Requirements: 1.1–1.9_

- [x] 6. Final checkpoint — full stack smoke test
  - Ensure all backend tests pass. Ask the user if questions arise before proceeding.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The backend can be started with: `uvicorn web.backend.api:app --reload`
- The frontend dev server can be started with: `npm run dev` inside `web/frontend/`
- Credentials are never persisted; they live only in React component state for the duration of the request

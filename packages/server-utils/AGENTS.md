# AGENTS

Purpose: Shared server-side utilities (HTTP wrappers, middleware, rate limiting, Redis/Postgres layers, metrics, crypto helpers) for all Effect-based backend services.

Stack: TypeScript, Effect. Jest tests under `src/__tests__`.

Gotchas:

- Changes here affect all backend services -- coordinate and test widely before merging.
- New middleware must remain opt-in/configurable, not implicitly applied.

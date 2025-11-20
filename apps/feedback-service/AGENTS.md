# AGENTS

Purpose: Handles in-app feedback submissions per `packages/rest-api/src/services/feedback`.

Stack: Node + TypeScript, Effect + @effect/platform HttpApiBuilder, shared security/redis/rate-limiting layers from `packages/server-utils`; esbuild for bundling; Jest for tests.

Commands (root):

- `yarn workspace @vexl-next/feedback-service dev` (dotenv).
- `yarn workspace @vexl-next/feedback-service test|test:watch`.
- `yarn workspace @vexl-next/feedback-service lint|typecheck|format:fix`.
- `yarn workspace @vexl-next/feedback-service build` then `start`.

Conventions:

- Implement handlers against REST spec types; use shared domain errors/schemas for validation.
- Wire infra with `Layer` + `packages/server-utils` (swagger, security, rate limiting, redis connections).
- Prefer `Effect` primitives and logging; avoid throwing/`console.log`.

Notes for agents:

- Keep privacy in mind; avoid logging sensitive payloads and blind errors with shared helpers.
- Add new env values via config modules, not raw `process.env` reads.

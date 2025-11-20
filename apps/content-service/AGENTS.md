# AGENTS

Purpose: Content service serving app-managed content/announcements under the REST contract in `packages/rest-api/src/services/content`.

Stack: Node + TypeScript ESM, Effect + @effect/platform HttpApiBuilder, shared crypto/security/rate-limit layers from `packages/server-utils`, esbuild outputs to `dist`.

Commands (root):

- `yarn workspace @vexl-next/content-service dev`.
- `yarn workspace @vexl-next/content-service test|test:watch` (Jest when present).
- `yarn workspace @vexl-next/content-service lint|typecheck|format:fix`.
- `yarn workspace @vexl-next/content-service build` then `start`.

Conventions:

- Keep handlers typed against the REST spec and schemas from shared packages; avoid bespoke validation.
- Compose middleware/infra with `Layer` and helpers (swagger, rate limiting, redis, security) from `packages/server-utils`.
- Use `Effect.log*` for observability; propagate failures with domain errors instead of throwing.

Notes for agents:

- Config is read through `Config`/dotenv; thread new settings via layers rather than `process.env` reads.
- Preserve caching/rate-limit behavior when adjusting endpoints.

# AGENTS

Purpose: Chat/messaging backend service implementing chat endpoints defined in `packages/rest-api/src/services/chat` for the mobile app.

Stack: Node + TypeScript ESM, Effect + @effect/platform HttpApiBuilder, shared crypto/rate limiting/redis layers from `packages/server-utils`, esbuild bundles.

Commands (root):

- `yarn workspace @vexl-next/chat-service dev` (dotenv).
- `yarn workspace @vexl-next/chat-service test|test:watch` for Jest.
- `yarn workspace @vexl-next/chat-service lint|typecheck|format:fix`.
- `yarn workspace @vexl-next/chat-service build` then `start` for prod run.

Conventions:

- Build handlers against the typed REST spec; keep DTOs in `packages/rest-api` and domain models in `packages/domain`.
- Compose dependencies through `Layer` (DB, redis, metrics, security). Use helpers from `packages/server-utils` for middleware/error handling instead of bespoke code.
- Prefer `Effect` error channels over thrown errors; use shared error types (`UnexpectedServerError`, `NotFoundError`, etc.).
- Keep logging via `Effect.log*` and ensure rate limiting stays wired for new groups.

Notes for agents:

- Check `configs.ts` for required env vars before adding new ones; thread them via Config rather than reading `process.env` directly.
- Maintain swagger exposure via `HttpApiSwagger` when adding routes.

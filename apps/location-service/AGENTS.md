# AGENTS

Purpose: Provides location-related endpoints (geo lookups, validations) defined in `packages/rest-api/src/services/location`.

Stack: Node + TypeScript, Effect + @effect/platform HttpApiBuilder, shared middleware (security, rate limiting, redis, swagger) from `packages/server-utils`; esbuild bundling; Jest for tests.

Commands (root):

- `yarn workspace @vexl-next/location-service dev`.
- `yarn workspace @vexl-next/location-service test|test:watch`.
- `yarn workspace @vexl-next/location-service lint|typecheck|format:fix`.
- `yarn workspace @vexl-next/location-service build` then `start`.

Conventions:

- Use REST spec + domain schemas for request/response types; avoid manual shape definitions.
- Compose dependencies via `Layer`; reuse helpers for crypto, caching, and error handling from `packages/server-utils`.
- Keep `Effect.log*` and typed error handling instead of throwing.

Notes for agents:

- Check `configs.ts` for env (e.g., external geo API keys) before adding new settings.
- Preserve rate limiting defaults on new routes to avoid abuse.

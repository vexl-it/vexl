# AGENTS

Purpose: User authentication/session service (login challenges, verification, session credential regeneration, erase-user flow) per `packages/rest-api/src/services/user`.

Stack: Node + TypeScript ESM, Effect + @effect/platform HttpApiBuilder, Postgres via @effect/sql, Redis, Twilio/Prelude integrations, shared middleware from `packages/server-utils`; bundled by esbuild; Jest tests present.

Commands (root):

- `yarn workspace @vexl-next/user-service dev`.
- `yarn workspace @vexl-next/user-service test|test:watch`.
- `yarn workspace @vexl-next/user-service lint|typecheck|format:fix`.
- `yarn workspace @vexl-next/user-service build` then `start`.

Conventions:

- Keep routes grouped via `HttpApiBuilder` and spec types; reuse `makeEndpointEffect`/error helpers to blind unexpected failures.
- Wire dependencies through `Layer` (DB, redis, metrics, rate limiting, crypto, dashboard hooks) rather than direct imports.
- Use domain schemas for user-facing payloads; do not bypass validation.
- Logging via `Effect.log*`; avoid logging sensitive codes or tokens.

Notes for agents:

- Env/config lives in `configs.ts`; thread new config via `Config` and avoid hardcoding Twilio/prelude URLs.
- Consider rate limiting and lockouts when changing login flows.

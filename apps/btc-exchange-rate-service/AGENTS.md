# AGENTS

Purpose: Effect-based HTTP service exposing BTC exchange rates for the Vexl apps.

Stack: Node + TypeScript (ESM), Effect + @effect/platform HttpApiBuilder, contracts in `packages/rest-api/src/services/btcExchangeRate`, shared middlewares from `packages/server-utils`, built with esbuild.

Commands (root):

- `yarn workspace @vexl-next/btc-exchange-rate-service dev` (dotenv loaded).
- `yarn workspace @vexl-next/btc-exchange-rate-service test|test:watch` for Jest suites.
- `yarn workspace @vexl-next/btc-exchange-rate-service lint|typecheck|format:fix` for quality.
- `yarn workspace @vexl-next/btc-exchange-rate-service build` then `start` for prod.

Conventions:

- Define handlers against spec types from `packages/rest-api`; group them with `HttpApiBuilder` like existing `RootLive`.
- Compose dependencies with `Layer` (redis connection, rate limiting, crypto, swagger). Use helpers in `packages/server-utils` instead of ad-hoc wiring.
- Keep schemas and errors in shared domain packages; avoid raw `any`.
- Log via `Effect.log*`; propagate errors through `Effect` rather than throwing.

Notes for agents:

- Config is pulled via `configs.ts`/`dotenv`; do not hardcode secrets or ports.
- Ensure rate limiting stays attached to new endpoints and responses remain blinded for unexpected errors.

# AGENTS

Purpose: Offer lifecycle service (listings, status changes) per `packages/rest-api/src/services/offer`.

Stack: Node + TypeScript, Effect + @effect/platform HttpApiBuilder, esbuild bundling, shared middleware (security, rate limiting, redis, swagger) from `packages/server-utils`; Jest for tests.

Commands (root):

- `yarn workspace @vexl-next/offer-service dev`.
- `yarn workspace @vexl-next/offer-service test|test:watch`.
- `yarn workspace @vexl-next/offer-service lint|typecheck|format:fix`.
- `yarn workspace @vexl-next/offer-service build` then `start`.

Conventions:

- Implement handlers against the typed REST spec; reuse domain schemas/errors for validation.
- Wire infra via `Layer` and helpers from `packages/server-utils`, not custom Express servers.
- Use `Effect` for flow control/error handling and keep logs via `Effect.log*`.

Notes for agents:

- Offers may have business rules; look for existing validations in shared packages before introducing new ones.
- Maintain pagination/rate-limit/caching behaviors from shared utilities when adding endpoints.

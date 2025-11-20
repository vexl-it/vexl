# AGENTS

Purpose: Contact ingestion/management backend powering contact-related endpoints in `packages/rest-api/src/services/contact`.

Stack: Node + TypeScript, Effect + @effect/platform HttpApiBuilder, shared security/rate-limiting/redis utilities from `packages/server-utils`, esbuild builds.

Commands (root):

- `yarn workspace @vexl-next/contact-service dev`.
- `yarn workspace @vexl-next/contact-service test|test:watch` for Jest suites.
- `yarn workspace @vexl-next/contact-service lint|typecheck|format:fix`.
- `yarn workspace @vexl-next/contact-service build` then `start`.

Conventions:

- Define routes against the REST spec; keep schemas/types in shared packages rather than duplicating.
- Use `Layer` to wire DB/redis/metrics and middleware from `packages/server-utils` (security, rate limiting, swagger setup).
- Prefer functional `Effect` flows over imperative promises; surface errors via typed error channels with common domain errors.
- Keep logging/metrics consistent with other services.

Notes for agents:

- Review `configs.ts` for env-driven settings; introduce new config through `Config`/`Layer` instead of reading env inline.
- Maintain pagination/rate-limit helpers from `packages/rest-api` where applicable.

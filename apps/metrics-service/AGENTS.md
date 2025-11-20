# AGENTS

Purpose: Metrics/analytics worker and HTTP surface for metrics events (uses `packages/rest-api/src/services/metrics`).

Stack: Node + TypeScript, Effect + @effect/platform, BullMQ for background processing, Postgres via @effect/sql, shared layers from `packages/server-utils`; bundled by esbuild.

Commands (root):

- `yarn workspace @vexl-next/metrics-service dev` for local run.
- `yarn workspace @vexl-next/metrics-service lint|typecheck|format:fix`.
- `yarn workspace @vexl-next/metrics-service build` then `start`.
- (No dedicated Jest suite today.)

Conventions:

- Define APIs against the REST spec; keep schemas and domain errors centralized.
- Wire infra (DB, redis, rate limiting, security) through `Layer` helpers; avoid ad-hoc queue setup without BullMQ configs.
- Use `Effect` for error handling/logging, not thrown exceptions.

Notes for agents:

- Be mindful of queue/DB connections; reuse pools/services from `packages/server-utils`.
- Keep any PII out of logs/metrics payloads and blind errors where needed.

# AGENTS

Purpose: Metrics/analytics worker and HTTP surface for metrics events per `packages/rest-api/src/services/metrics`.

Stack: Node + TypeScript, Effect + HttpApiBuilder, BullMQ for background processing, Postgres via @effect/sql, esbuild.

Gotchas:

- Uses BullMQ queues for background processing; avoid ad-hoc queue setup without going through existing BullMQ config patterns.
- Keep any PII out of logs/metrics payloads and blind errors where needed.

# AGENTS

Purpose: Metrics/analytics worker and HTTP surface for metrics events per `packages/rest-api/src/services/metrics`.

Stack: Node + TypeScript, Effect + HttpApiBuilder, BullMQ for background processing, Postgres via @effect/sql, esbuild.

Gotchas:

- Uses BullMQ queues for background processing; avoid ad-hoc queue setup without going through existing BullMQ config patterns.
- Keep any PII out of logs/metrics payloads and blind errors where needed.
- IMPORTANT: Anonymous frontend event metrics must never expose user identity. Persist only coarse non-identifying app metadata already allowed by common headers, such as platform/version, if needed. Do not store IP, country prefix, public keys, offer IDs, chat IDs, message IDs, text, or other user/content identifiers.

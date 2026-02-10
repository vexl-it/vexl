# AGENTS

Purpose: Source of truth for REST API contracts (specs, schemas, headers, generated clients) across all services and clients.

Stack: TypeScript, `effect/Schema`, `@effect/platform` HttpApi, Jest.

Gotchas:

- When adding endpoints, also update `tooling/generate-api-call-limits`.
- Keep rate limiting annotations up to date to avoid runtime mismatches.
- Maintain backward compatibility; bump client and server usages together when changing contracts.

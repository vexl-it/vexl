# AGENTS

Purpose: Source of truth for REST API contracts across services and clients (specifications, schemas, headers, helpers, and generated clients).

Stack: TypeScript with `effect/Schema` for runtime typing, `@effect/platform` HttpApi specs, utilities for rate limiting and pagination; Jest tests for key helpers.

Commands (root):

- `yarn workspace @vexl-next/rest-api lint|typecheck|format:fix|test`.

Conventions:

- Define/extend service specs under `src/services/<service>`; keep schemas and headers centralized here instead of duplicating in services.
- Maintain backward compatibility; bump client/server usages together when changing contracts.
- Use brand types (e.g., `ServiceUrl`, `Pagination`) and shared headers; avoid untyped strings.

Notes for agents:

- When adding endpoints, also update any tooling that inspects specs (e.g., `tooling/generate-api-call-limits`).
- Keep rate limiting annotations up to date to avoid runtime mismatches.

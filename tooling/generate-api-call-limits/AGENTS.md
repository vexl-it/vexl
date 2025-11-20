# AGENTS

Purpose: Utility to inspect REST API specs and compute/print API call limits; used in CI (`yarn turbo:test`) to ensure annotations exist.

Stack: TypeScript + Effect, consumes `packages/rest-api` specifications; built/run via tsx (no bundle by default).

Commands (root):

- `yarn workspace @vexl-next/generate-api-call-limits start` for ad-hoc generation.
- `yarn workspace @vexl-next/generate-api-call-limits check-for-missing-annotations` (used by CI).
- `yarn workspace @vexl-next/generate-api-call-limits print-api-call-limits`.
- `yarn workspace @vexl-next/generate-api-call-limits lint|typecheck|format:fix`.

Conventions:

- Keep logic driven by REST specs; avoid hard-coded limits outside annotations.
- Ensure output remains deterministic for CI; avoid non-stable ordering.
- Reuse shared schemas and avoid duplicating contract details.

Notes for agents:

- Update this tool when adding endpoints or rate limit annotations in `packages/rest-api` to keep CI green.

# AGENTS

Purpose: Inspects REST API specs and computes API call limits; CI runs `check-for-missing-annotations` via `yarn turbo:test`.

Stack: TypeScript + Effect, consumes `packages/rest-api`; run via tsx.

Gotchas:

- Update this tool when adding endpoints in `packages/rest-api`. CI runs `check-for-missing-annotations` via `yarn turbo:test`.
- Keep rate limit annotations up to date to stay CI green.

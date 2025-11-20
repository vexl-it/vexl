# AGENTS

Purpose: Shared server-side utilities for Effect-based services (HTTP server wrappers, middleware, rate limiting, Redis/Postgres layers, metrics, crypto/security helpers).

Stack: TypeScript + Effect; exports layered services/components consumed by all backend apps. Jest tests exist under `src/__tests__`.

Commands (root):

- `yarn workspace @vexl-next/server-utils lint|typecheck|format:fix|test`.

Conventions:

- Prefer existing helpers (`HttpCodes`, `RateLimiting`, `ServerCrypto`, `makeEndpointEffect`, etc.) before creating new server patterns.
- Keep new utilities composable as `Layer`/Effect services; avoid hard-coding env/ports.
- Follow shared error/logging practices (blind unexpected errors, use `Effect.log*`).

Notes for agents:

- Changing behaviors here affects all services—coordinate and test widely before merging.
- If adding middleware, ensure it remains opt-in/configurable and documented.

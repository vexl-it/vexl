# AGENTS

Purpose: Internal dashboard (React client + small Effect server) for monitoring/reporting Vexl data.

Stack: React 19 + Vite for client build, Emotion for styling, jotai for state. Server side uses Effect + @effect/platform, @effect/sql for Postgres access, and shared utilities from `packages/server-utils`/`packages/rest-api`/`packages/domain`.

Commands (root):

- `yarn workspace @vexl-next/dashboard-app dev` (runs server + client) or `dev:server` / `dev:client` separately.
- `yarn workspace @vexl-next/dashboard-app lint|typecheck|format:fix`.
- `yarn workspace @vexl-next/dashboard-app build` (calls `build:server` + `build:client`) then `start`.

Conventions:

- Client code under `src/` pairs with server code under `server/`. Keep API calls typed via `packages/rest-api` clients/utilities.
- Use Emotion style primitives already in place; avoid introducing a second styling system.
- Keep Effect Layer wiring for DB/metrics/security centralized; reuse helpers from `packages/server-utils` rather than ad-hoc HTTP servers.
- Maintain shared Prettier/ESLint rules (no semicolons, single quotes).

Notes for agents:

- Server and client share env via `.env`/Config; thread new settings through typed config modules.
- When adding metrics dashboards, favor derived state/hooks over duplicating fetch logic; keep WebSocket usage aligned with existing setup.

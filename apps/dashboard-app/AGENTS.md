# AGENTS

Purpose: Internal dashboard (React client + Effect server) for monitoring/reporting Vexl data.

Stack: React 19 + Vite (client), Emotion styling, jotai state. Effect + @effect/platform + @effect/sql (server).

Gotchas:

- Client code lives under `src/`, server code under `server/`.
- Use Emotion for styling; do not introduce a second styling system.
- Server and client share env via `.env`/Config; thread new settings through typed config modules.
- Keep WebSocket usage aligned with existing setup.

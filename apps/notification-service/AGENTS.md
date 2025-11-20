# AGENTS

Purpose: Notification service placeholder; currently exposes encryption key for FCM token handling.

Stack: Node + TypeScript, Effect + @effect/platform, shared layers from `packages/server-utils`; built with esbuild.

Commands (root):

- `yarn workspace @vexl-next/notification-service dev` (or `dev:watch`).
- `yarn workspace @vexl-next/notification-service lint|typecheck|format:fix`.
- `yarn workspace @vexl-next/notification-service build` then `start`.

Conventions:

- Follow the same HttpApiBuilder + Layer wiring as other services, using specs from `packages/rest-api/src/services/notification` if/when endpoints grow.
- Keep configs/env centralized; avoid direct `process.env` reads.
- Maintain shared Prettier/ESLint style.

Notes for agents:

- Service surface is small; keep changes minimal and document any new endpoints or env vars in this file/README.

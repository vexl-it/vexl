# AGENTS

Purpose: Collection of one-off scripts/utilities (often Effect-based) reused for operational tasks (e.g., QR generation, data pulls).

Stack: TypeScript ESM with Effect and shared @vexl-next packages; bundled with esbuild when needed.

Commands (root):

- `yarn workspace @vexl-next/handy-scripts lint|typecheck|format:fix`.
- Run specific scripts via tsx (check `src/`).

Conventions:

- Keep scripts small and composable; reuse shared utilities instead of duplicating logic from services.
- Document new scripts with short comments at the top explaining purpose and inputs.
- Avoid hard-coded secrets; load config via dotenv/Config when needed.

Notes for agents:

- Because scripts are ad-hoc, ensure they are safe/idempotent before running against production data.

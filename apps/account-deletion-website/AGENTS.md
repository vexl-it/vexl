# AGENTS

Purpose: Minimal Remix/Vite site that lets users request account deletion per app store requirements (public https://app.vexl.it).

Stack: React 19 + Remix 2, Tailwind CSS v4, TypeScript strict. Depends on shared domain/localization/rest-api utilities. Node 20+.

Commands (from repo root):
- `yarn workspace account-deletion-website2 dev` to run locally.
- `yarn workspace account-deletion-website2 build` then `start` for production-like run.
- `yarn workspace account-deletion-website2 lint` / `typecheck` for quality gates.

Conventions:
- Routes/components live under `app/`; keep handlers typed with shared schemas from `packages/rest-api`/`packages/domain` where applicable.
- Tailwind 4 is configured; prefer utility classes instead of ad-hoc CSS and keep markup accessible.
- Keep Prettier/ESLint defaults (single quotes, no semicolons). Use `yarn workspace ... format:fix` at root if formatting drifts.

Notes for agents:
- Environment variables (e.g., `BE_ENV`) are set when running `start`; avoid hard-coding API origins.
- This app is low priority per README; keep changes scoped and low-risk, and document any behavior changes.

# AGENTS

Purpose: Minimal Next.js site for account deletion requests (public https://app.vexl.it).

Stack: Next.js 16 App Router + React 19 + TypeScript + plain global CSS.

Gotchas:

- `BE_ENV` is read at runtime by server actions; avoid hard-coding API origins.
- Low-priority app -- keep changes scoped and low-risk.
- Keep backend calls on the server side. Client components should submit through server actions and only use browser APIs for local session storage and signing.

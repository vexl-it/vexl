# AGENTS

Purpose: User authentication/session service (login challenges, verification, session credential regeneration, erase-user flow).

Stack: Node + TypeScript ESM, Effect + HttpApiBuilder, Postgres via @effect/sql, Redis, Twilio/Prelude integrations, esbuild, Jest.

Gotchas:

- Uses Twilio/Prelude for SMS verification; config lives in `configs.ts`. Do not hardcode provider URLs.
- Consider rate limiting and lockout behavior when changing login flows; abuse protection is critical here.
- Never log sensitive codes or tokens (verification codes, session tokens).

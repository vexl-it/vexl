# AGENTS

Purpose: Shared cryptography primitives (ECDH, key holders, version wrappers) for mobile and backend.

Stack: TypeScript ESM, Effect helpers.

Gotchas:

- Do not log secrets or intermediate key material.
- Reuse `KeyHolder`, `operations`, and `versionWrapper` instead of creating ad-hoc crypto flows.
- Keep API changes backward compatible -- this package is consumed by multiple services and the mobile app.
- Validate new implementations with property tests (`fast-check`) where reasonable.

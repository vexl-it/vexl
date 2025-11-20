# AGENTS

Purpose: Shared cryptography primitives (ECDH-style operations, key holders, version wrappers) used by both mobile and backend services.

Stack: TypeScript ESM utilities, pure functions where possible; depends on Effect for some helpers. Exposes APIs under `src/index` for reuse.

Commands (root):

- `yarn workspace @vexl-next/cryptography lint|typecheck|format:fix`.
- `yarn workspace @vexl-next/cryptography test|test:watch` when adjusting logic.

Conventions:

- Keep functions deterministic and side-effect free; do not log secrets or intermediate key material.
- Reuse existing abstractions in `KeyHolder`, `operations`, and `versionWrapper` instead of creating ad-hoc crypto flows.
- Maintain type safety and runtime validation where applicable; prefer shared domain errors over generic ones.

Notes for agents:

- Any changes here impact multiple services and the mobile app—keep API changes backward compatible and document breaking changes.
- Validate new implementations with property tests (`fast-check`) where reasonable.

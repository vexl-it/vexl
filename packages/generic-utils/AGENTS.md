# AGENTS

Purpose: Shared generic utilities (string/number/time helpers, matching, truncation, etc.) used across services and mobile.

Stack: TypeScript ESM utilities with Effect/fp-ts/zod where helpful; exposed via `src/index`.

Commands (root):

- `yarn workspace @vexl-next/generic-utils lint|typecheck|format:fix`.
- Add or run Jest tests when modifying logic.

Conventions:

- Keep functions pure and side-effect free; avoid service-specific dependencies.
- Prefer existing helpers before adding new ones to limit surface area.
- Maintain full typing and avoid `any`; document edge cases with small tests.

Notes for agents:

- If you add breaking changes, coordinate updates in services/mobile that rely on these helpers.

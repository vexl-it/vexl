# AGENTS

Purpose: Localization utilities and translation resources shared by client surfaces.

Stack: TypeScript utilities and resource files under `src/`; integrates with shared tooling (ESLint/Prettier/tsconfig).

Commands (root):

- `yarn workspace @vexl-next/localization lint|typecheck|format:fix`.

Conventions:

- Keep translation keys stable; avoid inlining copy in consuming apps.
- Store new locale resources in the established structure and keep types in sync.
- Do not introduce runtime-only dependencies; this package should stay lightweight.

Notes for agents:

- Coordinate locale additions with mobile/dashboard to avoid missing keys.
- Respect Prettier config (tight braces, no semicolons) to keep diffs clean.
- When adding new translation, update only base.json, translations into other languages will be translated via crowdin and you don't have to worry about that while developing

# AGENTS

Purpose: Helpers for working with static/dynamic resources (files, URLs, pagination helpers) shared across services.

Stack: TypeScript utilities built on Effect; exports under `src/`.

Commands (root):

- `yarn workspace @vexl-next/resources-utils lint|typecheck|format:fix`.

Conventions:

- Keep utilities generic and side-effect free when possible; reuse existing types/brands from domain/rest-api packages.
- Maintain consistent error handling using shared domain errors instead of generic Error.
- Avoid pulling in heavy dependencies; this package should remain small and reusable.

Notes for agents:

- Validate changes with dependent services if you alter public functions.

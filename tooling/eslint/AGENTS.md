# AGENTS

Purpose: Shared ESLint configs (`index.js` base + `react.js`) consumed across workspaces.

Stack: ESLint 8 extending `standard-with-typescript` + Prettier; React plugin config with hooks rules and custom tweaks (disabled strict boolean expressions, jsx brace presence, etc.).

Commands (root):

- `yarn workspace @vexl-next/eslint-config lint|format|format:fix|clean`.

Conventions:

- Keep rule changes minimal and documented; they cascade to all packages.
- Prefer adding overrides in consuming packages before changing base defaults.
- Maintain ignore patterns (build outputs, configs) to prevent noisy lint results.

Notes for agents:

- When adjusting rules, re-run lint in a few representative workspaces to catch regressions.

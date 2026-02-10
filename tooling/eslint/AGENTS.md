# AGENTS

Purpose: Shared ESLint configs (`index.js` base + `react.js`) consumed across workspaces.

Stack: ESLint 8, `standard-with-typescript` + Prettier; React plugin with hooks rules.

Gotchas:

- Rule changes cascade to all packages; prefer overrides in consuming packages before changing base defaults.
- After adjusting rules, re-run lint in a few representative workspaces to catch regressions.

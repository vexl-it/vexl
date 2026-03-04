# AGENTS

Purpose: Shared ESLint configs (`index.mjs` base + `react.mjs`) consumed across workspaces.

Stack: ESLint 9 flat config, `eslint-config-love` + Prettier; React plugin with hooks rules.

Gotchas:

- Rule changes cascade to all packages; prefer overrides in consuming packages before changing base defaults.
- After adjusting rules, re-run lint in a few representative workspaces to catch regressions.

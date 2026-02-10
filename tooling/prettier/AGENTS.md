# AGENTS

Purpose: Central Prettier configuration for the monorepo.

Style: Single quotes, no semicolons, no bracket spacing, trailing commas (es5), quote props preserved, plugins for organize-imports/SQL/embed.

Gotchas:

- Referenced via `"prettier": "@vexl-next/prettier-config"` in each package's `package.json`; keep path stable.
- Changes affect every workspace; validate large diffs before adjusting options.

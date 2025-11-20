# AGENTS

Purpose: Central Prettier configuration for the monorepo.

Style: Single quotes, no semicolons, no bracket spacing, trailing commas (es5), quote props preserved, plugins for organize-imports/SQL/embed.

Commands (root):

- `yarn workspace @vexl-next/prettier-config format` or `format:fix` to check/apply formatting.

Conventions:

- Keep config minimal; changes affect every workspace. Validate large diffs before adjusting options.
- When adding plugins, ensure they work with Yarn 3 and do not slow down formatting excessively.

Notes for agents:

- Prettier config is referenced via `"prettier": "@vexl-next/prettier-config"` in packages; keep path stable.

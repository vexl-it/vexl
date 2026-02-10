**Note**: This project uses the open AGENTS.md standard. These files are symlinked to CLAUDE.md files in the same directory for interoperability with Claude Code. Any agent instructions or memory features should be saved to AGENTS.md files instead of CLAUDE.md files.

# AGENTS

Purpose: Monorepo for Vexl mobile app, backend services, and shared tooling. Uses Yarn 3 workspaces with node-modules linker and Turbo for orchestration.

Structure:

- apps/\*: Expo mobile app, Remix site, dashboard client/server, and Effect-based HTTP services.
- packages/\*: Shared TypeScript libraries (domain schemas, REST API specs, crypto, utilities, localization, server helpers).
- tooling/\*: Shared configs (eslint, prettier, tsconfig), esbuild helpers, API limit generator, handy scripts.

Commands:

- **MUST use `yarn` only** (never npm/pnpm). Install deps with `yarn` at repo root.
- Run workspace scripts: `yarn workspace <name> <script>`
- Turbo tasks: `yarn turbo:lint`, `yarn turbo:typecheck`, `yarn turbo:format` (or `:fix`), `yarn turbo:test`

Code rules:

- **NEVER use the `as` keyword in TypeScript.** Use `Schema.decodeUnknown` to validate external data via `effect/Schema`.
- HTTP services: build on `HttpApiBuilder` + `Layer`; reuse helpers from `packages/server-utils`. Keep schemas/types in shared packages.
- Prefer Effect `Array` helpers with `pipe` over native array methods (`filter`, `map`, etc.). Use `Array.isNonEmptyArray` for emptiness checks.
- Always use Context7 MCP tools (`resolve-library-id` then `query-docs`) for library documentation. For Effect, use the `effect-ts/effect` library ID.
- When migrating fp-ts to Effect, use the `fp-to-effect-migrator` agent.
- Define custom errors by extending `Schema.TaggedError` (for example `class MyError extends Schema.TaggedError<MyError>(...)`) instead of extending `Error`, to keep error handling consistent across the codebase.

IMPORTANT -- Verification steps (do this after EVERY change):

1. Run `yarn turbo:typecheck` in the affected workspace. Read the output and fix all errors.
2. Run `yarn turbo:format`. If it fails, run `yarn turbo:format:fix` first, then re-run.
3. Run `yarn turbo:lint`. Fix any errors.
4. Do NOT consider your work done until all three pass cleanly.

Workspace AGENTS.md: Update the relevant workspace AGENTS.md if you change conventions or commands.

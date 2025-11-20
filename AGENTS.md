**Note**: This project uses the open AGENTS.md standard. These files are symlinked to CLAUDE.md files in the same directory for interoperability with Claude Code. Any agent instructions or memory features should be saved to AGENTS.md files instead of CLAUDE.md files.

# AGENTS

Purpose: Monorepo for Vexl mobile app, backend services, and shared tooling. Uses Yarn 3 workspaces with node-modules linker and Turbo for orchestration.

Structure:

- apps/\*: Expo mobile app, Remix site, dashboard client/server, and Effect-based HTTP services.
- packages/\*: Shared TypeScript libraries (domain schemas, REST API specs, crypto, utilities, localization, server helpers).
- tooling/\*: Shared configs (eslint, prettier, tsconfig), esbuild helpers, API limit generator, handy scripts.

Tooling & style:

- Yarn only; root scripts run Turbo (`yarn turbo:*`). Use `yarn workspace <name> <script>` inside workspaces.
- TypeScript strict configs (`tooling/tsconfig`), ESLint extends `standard-with-typescript` (+ React when needed), Prettier config enforces single quotes, no semicolons, tight braces, trailing commas.
- Tests mostly Jest; Effect/Schema used for runtime types; REST API contracts live in `packages/rest-api` and domain errors in `packages/domain`.

Agent playbook:

- Install deps with `yarn` at repo root; avoid npm/pnpm. Node 20+ assumed.
- For quick checks use `yarn turbo:lint`, `yarn turbo:typecheck`, `yarn turbo:format` (or `:fix`). Some services also have `yarn turbo:test` (runs API limit checker plus tests).
- When touching HTTP services, build on `HttpApiBuilder` + `Layer`; reuse middlewares, rate limiting, crypto, and error helpers from `packages/server-utils`. Keep schemas/types in shared packages; avoid ad-hoc types.
- For client code (dashboard/mobile/remix), keep hooks/components typed, prefer shared domain/rest-api utilities, and align with Prettier/ESLint rules.
- Update the relevant workspace AGENTS.md if you change conventions or commands.
- Automatically use context7 for code generation and library documentation.
- When using effect use llmstxt/effect_website_llms_txt documentation from context7

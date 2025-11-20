# AGENTS

Purpose: Shared esbuild helper used by services/packages to bundle TypeScript into CJS dist outputs.

Stack: Simple Node ESM script invoking esbuild with common defaults (node platform, es2020 target, sourcemaps).

Commands (root):

- `yarn workspace @vexl-next/esbuild lint|format`.

Conventions:

- Keep config minimal and reusable; avoid hard-coding entry points outside `src/index.ts` unless coordinated with consumers.
- If adding plugins/options, ensure they work across all backend services and keep build output compatible with Node runtimes used in Docker.

Notes for agents:

- Test downstream builds (`yarn workspace <service> build`) after modifying this helper.

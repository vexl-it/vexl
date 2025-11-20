# AGENTS

Purpose: Shared tsconfig presets (`base.json`, `generic-esm.json`) for repo packages.

Details:
- Strict TypeScript with `checkJs`, `noUncheckedIndexedAccess`, ESNext modules, no emit by default. Generic ESM preset emits declarations and sourcemaps for universal packages.

Usage:
- Consume via `extends: "@vexl-next/tsconfig/base.json"` or `generic-esm.json` in workspace tsconfig files.

Notes for agents:
- Adjust compiler options cautiously; changes ripple into all services and packages.
- Keep excludes aligned with repo outputs (`dist`, `.next`, `.expo`).

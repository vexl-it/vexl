# AGENTS

Purpose: Minimal Expo app for previewing and testing @vexl-next/ui components on iOS and Android.

Stack: Expo 54, React 19.1.2, React Native 0.81.5, Tamagui v1.

Gotchas:

- The `tamagui.config.ts` at project root re-exports from `@vexl-next/ui` — this is needed for the Babel plugin. It requires an `eslint-disable` for `no-restricted-exports` (default export).
- Metro is configured to resolve from the monorepo root (`watchFolders` + `nodeModulesPaths` in `metro.config.js`).
- The lint script covers all files (`'**/*.{js,ts,tsx,jsx,cjs,mjs}'`), not just `src/` — there is no `src/` directory.
- Use `React.JSX.Element` return type (not bare `JSX.Element`).
- This app is for development only — not intended for production builds.

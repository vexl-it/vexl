# AGENTS

Purpose: Minimal Expo app for previewing and testing @vexl-next/ui components on iOS and Android.

Stack: Expo 54, React 19.1.2, React Native 0.81.5, Tamagui v1.

Structure:

- `App.tsx` — Root component with theme provider and screen navigation.
- `screens/index.ts` — Screen registry. Each entry has a `label` and `component`.
- `screens/<ComponentName>Screen.tsx` — One preview screen per UI component.

Adding a new preview screen requires two changes:

1. Create `screens/<ComponentName>Screen.tsx` showing all variants in light and dark themes side-by-side (wrap each column in `<Theme name="light">` / `<Theme name="dark">`).
2. Add an entry to the `screens` array in `screens/index.ts`.

Gotchas:

- The `tamagui.config.ts` at project root re-exports from `@vexl-next/ui` — this is needed for the Babel plugin. It requires an `eslint-disable` for `no-restricted-exports` (default export).
- Metro is configured to resolve from the monorepo root (`watchFolders` + `nodeModulesPaths` in `metro.config.js`). Native modules used by workspace packages (e.g. `react-native-svg` from `@vexl-next/ui`) must be pinned in `metro.config.js` `resolveRequest` alongside `react` and `react-native` to prevent duplicate instances — otherwise the copy in the workspace's `node_modules` won't have native bindings registered.
- The lint script covers all files (`'**/*.{js,ts,tsx,jsx,cjs,mjs}'`), not just `src/` — there is no `src/` directory.
- Use `React.JSX.Element` return type (not bare `JSX.Element`).
- This app is for development only — not intended for production builds.

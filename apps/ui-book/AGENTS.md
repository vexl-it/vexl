Structure:

- `App.tsx` — Root component with theme provider and screen navigation.
- `screens/index.ts` — Screen registry. Each entry has a `label` and `component`.
- `screens/<ComponentName>Screen.tsx` — One preview screen per UI component.

Adding a new preview screen requires two changes:

1. Create `screens/<ComponentName>Screen.tsx` that renders `<ComponentScreenLayout title="<label>" demos={Demos} />`. The layout renders `Demos` once per theme, light and dark side by side on wide screens. Group variants with `DemoSection`, write all text with `Typography`, and use theme tokens instead of hex colours. Keep demo state per instance (`useState(() => atom(...))`), because `Demos` mounts twice. Pass `fill` when the demo scrolls itself (FlatList based), so it is not nested in the page ScrollView.
2. Add an entry to the `screens` array in `screens/index.ts`.

Web:

- `pnpm --filter @vexl-next/ui-book web` starts Expo web (default http://localhost:8081). `expo export --platform web` builds a static site.
- Fonts load through `useVexlFonts.web.ts`; `Alert.alert` shows as a toast on web (react-native-web's Alert does nothing).

Gotchas:

- The `tamagui.config.ts` at project root re-exports from `@vexl-next/ui` — this is needed for the Babel plugin. It requires an `eslint-disable` for `no-restricted-exports` (default export).
- When a preview needs a concrete color string for icons, SVG props, React Native props, gradients, or other non-token props, read it with `const theme = useTheme()` and call `.get()` (e.g. `theme.foregroundPrimary.get()`). Do not use `.val` for theme colors and do not read element colors from `getTokens().color`.
- Metro uses the default Expo config: the hoisted pnpm linker keeps one copy of each native module, so no resolver pinning is needed.
- `react` and `react-dom` **must** match the renderer bundled inside `react-native`. A mismatch causes an "Incompatible React versions" runtime error.
- `@tamagui/babel-plugin` is a native-only extractor, so `babel.config.js` skips it on web via `api.caller`.
- The `react-native-reanimated/plugin` Babel plugin must be listed **last** in `babel.config.js` (required by reanimated).
- The lint script covers all files (`'**/*.{js,ts,tsx,jsx,cjs,mjs}'`), not just `src/` — there is no `src/` directory.
- Use `React.JSX.Element` return type (not bare `JSX.Element`).
- This app is for development only — not intended for production builds.

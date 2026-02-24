# AGENTS

Purpose: Shared UI package providing the Vexl design system built on Tamagui. Native-only (no web/media queries).

Stack: TypeScript, Tamagui v1, React.

Structure:

- `src/config/` — Tamagui configuration (tokens, themes, fonts).
- `src/provider/` — VexlThemeProvider and theme hooks.
- `src/primitives/` — Re-exported Tamagui primitive components (Stack, Text, etc.).
- `src/components/` — Custom Vexl design-system components:
  - `Button` — Primary action button (5 variants × 3 sizes).
  - `CardButton` — Small card-level button (filled/text × contrast flag). Filled+contrast uses theme tokens; filled without uses primitives ($black100/$white100).
  - `FabButton` — Floating action button (icon + label, always yellow primary).
  - `IconButton` — Square icon button with optional badge.
  - `NavButton` — Navigation bar button (icon/text × highlighted/destructive/normal). Normal variant wraps in `<Theme name="light">` to stay light in dark mode.

Design tokens sourced from Figma file `P7IaNcwu4qoS9uTL7ECiWL` (Vexl redesign DEV, node 593:39715):

- **Colors**: 24 semantic theme tokens (light/dark) across accents, background, foreground, vibrant groups.
- **Spacing**: 14-step scale (0px–80px).
- **Corner radius**: 13-step scale (0px–40px).
- **Typography**: TT Satoshi (body, weights 500/600) and Monument Extended (heading, weights 400/700).

Component patterns:

- Purely visual components use `styled()` with a `name` property matching the export name.
- Components needing coordinated styling (e.g. frame + label sharing a variant) use a functional component that composes internal styled primitives and forwards variant props to each.
- Use theme tokens (`$foregroundPrimary`) over raw color tokens (`$black100`) unless the design intentionally avoids theme-switching (e.g. CardButton filled without contrast).
- When a variant must ignore the surrounding theme, wrap it in `<Theme name="light">` (see NavButton normal variant).

Gotchas:

- This is a native-only package. Do NOT add `@tamagui/react-native-media-driver` or media queries.
- Do NOT copy from the existing mobile app tamagui config — the new design system is separate.
- Font family names (`TTSatoshi`, `MonumentExtended`) are placeholders — actual font files need loading via expo-font in consuming apps.
- Always re-export the tamagui config from `src/config/tamagui.config.ts` so consuming apps can reference it in their Babel plugin.
- Use `React.JSX.Element` return type (not bare `JSX.Element`) — the generic-esm tsconfig doesn't provide the global JSX namespace.
- After changes, run `yarn workspace @vexl-next/ui typecheck` to verify.

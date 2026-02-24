# AGENTS

Purpose: Shared UI package providing the Vexl design system built on Tamagui. Native-only (no web/media queries).

Stack: TypeScript, Tamagui v1, React.

Structure:

- `src/config/` — Tamagui configuration (tokens, themes, fonts).
- `src/provider/` — VexlThemeProvider and theme hooks.
- `src/primitives/` — Re-exported Tamagui primitive components (Stack, Text, etc.).
- `src/components/` — Custom Vexl design-system components (added incrementally).

Design tokens sourced from Figma file `P7IaNcwu4qoS9uTL7ECiWL` (Vexl redesign DEV, node 593:39715):

- **Colors**: 24 semantic theme tokens (light/dark) across accents, background, foreground, vibrant groups.
- **Spacing**: 14-step scale (0px–80px).
- **Corner radius**: 13-step scale (0px–40px).
- **Typography**: TT Satoshi (body, weights 500/600) and Monument Extended (heading, weights 400/700).

Gotchas:

- This is a native-only package. Do NOT add `@tamagui/react-native-media-driver` or media queries.
- Do NOT copy from the existing mobile app tamagui config — the new design system is separate.
- Font family names (`TTSatoshi`, `MonumentExtended`) are placeholders — actual font files need loading via expo-font in consuming apps.
- Always re-export the tamagui config from `src/config/tamagui.config.ts` so consuming apps can reference it in their Babel plugin.
- Use `React.JSX.Element` return type (not bare `JSX.Element`) — the generic-esm tsconfig doesn't provide the global JSX namespace.
- After changes, run `yarn workspace @vexl-next/ui typecheck` to verify.

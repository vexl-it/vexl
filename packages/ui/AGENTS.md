# AGENTS

## Component inventory

Read the component source in `src/components/<Name>/` for full props, tokens, and layout.

## Component patterns

- Purely visual components use `styled()` with a `name` property matching the export name.
- Components needing coordinated styling (e.g. frame + label sharing a variant) use a functional component that composes internal styled primitives and forwards variant props to each.
- For image filters (grayscale, color transforms), use `react-native-svg` SVG filters (`Filter`, `FeColorMatrix`, etc.) instead of third-party native filter libraries — they work with Fabric/New Architecture out of the box. Render images via SVG `<Image>` with `preserveAspectRatio="xMidYMid slice"` for cover-like behavior.
- For icon props, pass the component type (`React.ComponentType<IconProps>`) not a rendered element. The consuming component destructures with a capital alias (`icon: Icon`) and renders `<Icon color={...} size={...} />` directly. Never use `React.cloneElement` for color injection.

## Gotchas

- Native-only package. Do NOT add `@tamagui/react-native-media-driver` or media queries.
- Do NOT copy from the existing mobile app tamagui config — the new design system is separate.
- Always re-export the tamagui config from `src/config/tamagui.config.ts` so consuming apps can reference it in their Babel plugin.
- Use `React.JSX.Element` return type (not bare `JSX.Element`) — the generic-esm tsconfig doesn't provide the global JSX namespace.
- After changes, run `yarn workspace @vexl-next/ui typecheck` to verify.

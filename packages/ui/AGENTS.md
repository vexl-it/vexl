# AGENTS

## Component inventory

Read the component source in `src/components/<Name>/` for full props, tokens, and layout.

## Component patterns

- Purely visual components use `styled()` with a `name` property matching the export name.
- Components needing coordinated styling (e.g. frame + label sharing a variant) use a functional component that composes internal styled primitives and forwards variant props to each.
- For image filters (grayscale, color transforms), use `react-native-svg` SVG filters (`Filter`, `FeColorMatrix`, etc.) instead of third-party native filter libraries — they work with Fabric/New Architecture out of the box. Render images via SVG `<Image>` with `preserveAspectRatio="xMidYMid slice"` for cover-like behavior.
- For icon props, pass the component type (`React.ComponentType<IconProps>`) not a rendered element. The consuming component destructures with a capital alias (`icon: Icon`) and renders `<Icon color={...} size={...} />` directly. Never use `React.cloneElement` for color injection.

## Cross-platform (native + web)

The package runs on native and on web through react-native-web (ui-book web now, the Next.js website later). Keep every component working on both:

- Read window size, `window`, `document` and other platform globals inside components or effects (`useWindowDimensions()`), so module load stays SSR-safe.
- For a web-only implementation, add a sibling `<Name>.web.tsx` exporting the same API. Prefer a small `Platform.OS === 'web'` branch when the difference is one prop.
- Give SVG `id`s (gradients, filters, clip paths) a `useId()` value: on web every id lives in one document.
- Media props (`$sm`, `$md`, `$lg`, `$xl` from `src/config/media.ts`, mobile-first `minWidth`) are for web-specific layout only, because unfolded Android foldables match them too. Components stay fluid by default.
- Fonts: native loads `vexlFonts` with expo-font. Web ignores Tamagui's `face`, so register `getVexlFontFaceCss(resolveUrl)` (`src/assets/fonts`) as a `<style>`; see `apps/ui-book/useVexlFonts.web.ts`.
- Check web changes in ui-book web (`apps/ui-book/AGENTS.md`).

## Gotchas

- Do NOT copy from the existing mobile app tamagui config — the new design system is separate.
- Always re-export the tamagui config from `src/config/tamagui.config.ts` so consuming apps can reference it in their Babel plugin.
- Use `React.JSX.Element` return type (not bare `JSX.Element`) — the generic-esm tsconfig doesn't provide the global JSX namespace.
- After changes, run `pnpm --filter @vexl-next/ui typecheck` to verify.

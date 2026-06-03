It's important to make UI / UX of vexl mobile app consistend and aligned.

When creating or modifying any UI components in the app you should prefer using components in the @vexl-next/ui package. If there is not a component for your use case, you should consider creating a new one or modifying already existing one. If you stumble upon repeating pattern you are encouraged to extract it to a separate component in the @vexl-next/ui package and reuse it across the app.


## Important principles

- UI theme colors: when a component needs a concrete color string for icons, SVG props, React Native props, gradients, or other non-token props, read it with `const theme = useTheme()` and call `.get()` (for example `theme.foregroundPrimary.get()`). Do not use `.val` for theme colors; keep `.val` for non-color tokens such as spacing and size.
- Do NOT wrap `useTheme()` values or `getTokens()` lookups in `useMemo`. `useTheme()` is already reactive — it tracks accessed keys and only re-renders when those values change. `getTokens()` returns static config defined once at setup. This also applies to simple conditional derivations (e.g. ternaries picking between two theme values based on a prop). Only use `useMemo` for genuinely expensive computations.
- Use theme tokens (`$foregroundPrimary`) over raw color tokens (`$black100`) unless the design intentionally avoids theme-switching (e.g. CardButton filled without contrast).
- For animated components, use `react-native-reanimated` (shared values, `useAnimatedStyle`, `withTiming`/`withSequence`/`withRepeat`). Resolve non-color token-derived pixel values via `getTokens()` (e.g. `getTokens().size.$3.val`). Do NOT wrap `.val` in `Number()` or `String()`. For scheduling JS callbacks from worklet animations, use `scheduleOnRN` from `react-native-worklets` (NOT the deprecated `runOnJS`). Note: `scheduleOnRN(fn, ...args)` calls directly (returns void), unlike the old `runOnJS(fn)(...args)` curried pattern.
- When using text in mobile app always use Typography component from `@vexl-next/ui/src/components/Typography.tsx` instead of raw `Text` components, to keep text styling consistent across the app and aligned with the new design system.
- Use spacing, padding, gaps, border radiuses, and similar sizing values from `@vexl-next/ui/src/config/tokens.ts`.
- On Tamagui components, prefer Tamagui shorthand props that resolve to the shared tokens.
- On non-Tamagui components, read from the shared theme/tokens objects instead of hardcoding values.
- Use icon components from `@vexl-next/ui` / `packages/ui` instead of loading icon artwork through `Image` or external SVG sources.

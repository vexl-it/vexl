# AGENTS

Purpose: React Native/Expo mobile app for Vexl (core user experience).

Stack: Expo + React Native, TypeScript, Metro bundler, Maestro for E2E.

Gotchas:

- Metro caches can be sticky; use `fresh-start-*` scripts if bundling breaks.
- Reuse existing native modules (`packages/ecdh-platform-native-utils`, `fix-brorand-for-expo`) instead of adding new native code paths.
- When using Expo-related packages and functions, use expo/expo documentation from context7.

IMPORTANT: When creating or modifying UI, always use components from `@vexl-next/ui` where possible. For icons, do not render SVG assets via `Image` or `svg` sources; use icon components from `@vexl-next/ui` / `packages/ui` instead. When specifying colors, use color tokens from `@vexl-next/ui/src/config/themes.ts`.

Redesign guidance:

- The codebase currently contains both pre-redesign UI and redesigned UI. For any UI/UX work inside `apps/mobile`, prefer the redesigned conventions and `packages/ui` building blocks instead of copying legacy patterns from older mobile screens.
- Reuse components from `@vexl-next/ui` wherever possible before creating ad-hoc mobile-only UI. Prefer `@vexl-next/ui/src/components/Typography.tsx` for text styling instead of reintroducing old text conventions.
- Keep visual styling aligned with the new UI package.
- Use colors from `@vexl-next/ui/src/config/themes.ts`.
- When a component needs a concrete color string for icons, SVG props, React Native props, gradients, or other non-token props, read it with `const theme = useTheme()` and call `.get()` (e.g. `theme.foregroundPrimary.get()`). Do not use `.val` for theme colors and do not read element colors from `getTokens().color`.
- Use spacing, padding, gaps, border radiuses, and similar sizing values from `@vexl-next/ui/src/config/tokens.ts`.
- On Tamagui components, prefer Tamagui shorthand props that resolve to the shared tokens.
- On non-Tamagui components, read from the shared theme/tokens objects instead of hardcoding values.
- Use icon components from `@vexl-next/ui` / `packages/ui` instead of loading icon artwork through `Image` or external SVG sources.

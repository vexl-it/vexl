# AGENTS

Purpose: React Native/Expo mobile app for Vexl (core user experience).

Stack: Expo + React Native, TypeScript, metro bundler. Uses shared @vexl-next packages (domain, rest-api, crypto, localization, utils). Testing via Maestro for E2E; Jest config present for unit tests.

Commands (root):

- `yarn workspace @vexl-next/mobile-app start` then `android`/`ios`/`web` for platform runs.
- `yarn workspace @vexl-next/mobile-app lint|typecheck|format:fix`.
- E2E: `yarn workspace @vexl-next/mobile-app e2e-test` after `yarn start`.

Conventions:

- Keep screens/components in `src/` and favor function components + hooks. Type all navigation params and API responses using shared schemas.
- Do not commit platform-specific secrets; use `.env` with map API keys and Sentry flags as documented in README.
- Styling follows existing patterns (likely StyleSheet/Tailwind-style libs in codebase); align with current conventions rather than introducing new packages.
- Prettier/ESLint shared configs apply (no semicolons, single quotes).

Notes for agents:

- Metro caches can be sticky; use `fresh-start-*` scripts if bundling breaks.
- When integrating native utilities, reuse provided modules (e.g., `packages/ecdh-platform-native-utils`, `fix-brorand-for-expo`) instead of adding new native code paths.
- When using expo related packages and functions use expo/expo documentation from context7

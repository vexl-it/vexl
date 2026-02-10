# AGENTS

Purpose: React Native/Expo mobile app for Vexl (core user experience).

Stack: Expo + React Native, TypeScript, Metro bundler, Maestro for E2E.

Gotchas:

- Metro caches can be sticky; use `fresh-start-*` scripts if bundling breaks.
- Reuse existing native modules (`packages/ecdh-platform-native-utils`, `fix-brorand-for-expo`) instead of adding new native code paths.
- When using Expo-related packages and functions, use expo/expo documentation from context7.

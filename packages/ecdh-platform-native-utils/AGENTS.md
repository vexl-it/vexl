# AGENTS

Purpose: React Native native module exposing ECDH platform utilities to the mobile app.

Stack: TypeScript wrapper with iOS (Swift/Obj-C) and Android (Kotlin/Java) native code; Babel config for RN; podspec included.

Commands (root):
- `yarn workspace @vexl-next/react-native-ecdh-platform-native-utils lint|typecheck`.
- `yarn workspace @vexl-next/react-native-ecdh-platform-native-utils clean` to reset build artifacts.

Conventions:
- Keep the JS/TS interface stable and typed; ensure iOS and Android implementations stay in sync.
- Avoid introducing platform-specific behaviors unless guarded in JS with clear fallbacks.
- Follow RN native module setup patterns; update podspec/Gradle files when adding native deps.

Notes for agents:
- Changes affect mobile builds; test on both platforms after altering native code.
- Keep logging minimal and avoid leaking cryptographic material from native layers.

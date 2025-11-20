# AGENTS

Purpose: Shim to patch `brorand` for Expo environments (used by mobile crypto stack).

Stack: Minimal JS module published as workspace package; no scripts defined.

Guidelines:
- Keep this package tiny and compatible with Expo bundler; avoid adding new dependencies.
- If you change behavior, verify the mobile app still bundles without native shims and crypto still works.
- Update version constraints in consumers if breaking changes are introduced.

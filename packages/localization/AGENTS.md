# AGENTS

Purpose: Localization utilities and translation resources shared by client surfaces.

Stack: TypeScript, JSON resource files.

Gotchas:

- Prefer updating `base.json` when adding or changing translation keys. Direct edits to sibling `*-base.json` locale files are allowed only through the repository localization skills when syncing missing translations or removing unused keys.
- When locale files are edited directly, make sure the same translation changes are uploaded to Crowdin before running `crowdin download`; otherwise Crowdin can overwrite the local edits.
- Coordinate locale additions with mobile/dashboard to avoid missing keys.

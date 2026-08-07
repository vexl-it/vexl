# AGENTS

Purpose: Localization utilities and translation resources shared by client surfaces.

Stack: TypeScript, JSON resource files.

Gotchas:

- English source strings live in `locales/en/<group>.json`; locale files are flat JSON with dotted keys.
- Add or change strings only in the English group, run `pnpm generate`, and commit the source and generated catalogs. General Translation translates them in CI and opens a sync PR.
- Non-English files are machine-generated. To correct one, edit `locales/<locale>/<group>.json` and make the same correction in the General Translation dashboard so the next sync keeps it.
- Never edit `src/translations.ts` or `src/extraTranslations.ts`; regenerate them with `pnpm generate`.
- Run `pnpm check:translations` to validate locale JSON, orphan keys, and codegen freshness.
- Coordinate locale additions with mobile/dashboard to avoid missing keys.

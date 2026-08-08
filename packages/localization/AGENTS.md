# AGENTS

Purpose: Localization utilities and translation resources shared by client surfaces.

Stack: TypeScript, JSON resource files.

Gotchas:

- English source strings live in `locales/en/<group>.json`; locale files are flat JSON with dotted keys.
- Add or change strings only in the English group, run `pnpm generate`, and commit the source and generated catalogs. General Translation translates them in CI and opens a sync PR.
- Non-English files are machine-generated. To correct one, edit `locales/<locale>/<group>.json` and commit — the translation workflow runs `gt translate --save-local`, which uploads committed edits to the General Translation platform so they persist. (Corrections made in the GT dashboard flow back via the nightly sync PR; avoid editing the same string in both places between syncs.)
- Slavic plural forms: GT only generates the `_one`/`_other` categories present in English. When adding a plural key, hand-add `_few` (cs, sk, pl) and `_many` (pl) forms to those locale files where the wording differs from `_other`.
- Never edit `src/translations.ts` or `src/extraTranslations.ts`; regenerate them with `pnpm generate`.
- Run `pnpm check:translations` to validate locale JSON, orphan keys, and codegen freshness.
- Coordinate locale additions with mobile/dashboard to avoid missing keys.

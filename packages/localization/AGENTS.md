# AGENTS

Purpose: Localization utilities and translation resources shared by client surfaces.

Stack: TypeScript, JSON resource files.

Gotchas:

- English source strings live in `locales/en/<group>.json`; locale files are flat JSON with dotted keys.
- Adding or changing a string: follow `.agents/skills/adding-translation-key` — write the English key, run `pnpm generate`, then spawn a translator subagent that fills all shipped locales (`docs/translating.md`). Translations are written by agents in the same PR; there is no external translation service.
- Shipped vs unshipped locales are `APP_LOCALES` / `EXTRA_LOCALES` in `scripts/generateTranslations.mjs`. Unshipped locales are exempt from translation and parity checks — see `README.md`.
- Plural keys: `en` carries `_one`/`_other`; every shipped locale owes a form for each CLDR cardinal category of its language (cs/sk/pl need `_few`/`_many`). CI enforces this.
- Never edit `src/translations.ts` or `src/extraTranslations.ts`; regenerate them with `pnpm generate`.
- `pnpm check:translations` validates everything: locale JSON, orphan/missing keys, placeholder parity, plural completeness, codegen freshness. `--json` emits the machine-readable report, `--fix-stale` deletes orphan keys.
- The legal document groups (`privacyPolicy`, `termsOfUse`, `childSafetyAndSexAbusePrevention`) are never auto-translated; changing them is a human decision per locale.

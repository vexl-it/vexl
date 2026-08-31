# @vexl-next/localization

Translation resources and generated typed catalogs shared by the mobile app and backend services. Runtime i18n is i18next; `t()` call sites are type-checked against the generated English catalog.

## Layout

- `locales/<locale>/<group>.json` — flat JSON, literal dotted keys (`"tabBar.map": "Map"`), i18next `{{variable}}` interpolation. English (`locales/en/`) is the source of truth.
- `src/translations.ts` / `src/extraTranslations.ts` — generated catalogs. Never edit by hand; run `pnpm generate`.

## How translation works

There is no third-party translation service. Translations are written by AI agents and live only in git:

- Adding or changing a string: the `adding-translation-key` skill (`.agents/skills/adding-translation-key`) — the same PR that adds English copy carries its translations for all shipped locales.
- Full parity repair: the user-invoked `translation-audit` skill.
- Every PR is gated by the `[Translation] check` workflow, which runs `pnpm check:translations` and posts a review comment with new/changed strings and their translations.
- Human review: native speakers correct translations via PRs — see `docs/how_to_help_translate.md`. Brand voice rules for translators live in `docs/brand-narrative/translator-brief.md`.

## Shipped vs unshipped locales

Defined in `scripts/generateTranslations.mjs`:

- **`APP_LOCALES`** (shipped, bundled in the app): en, cs, de, fr, it, pt, pl, es, sk, bg, ja, nl, sw, zh. These are fully translated and enforced by CI (missing keys, `{{placeholder}}` parity, CLDR plural completeness).
- **`EXTRA_LOCALES`** (committed but not shipped): ar, fa, fi, id, no, pcm, sv, tr, uk. These are deliberately exempt from translation and parity checks — only basic validity and orphan-key checks apply. They exist as a starting point for a possible future rollout; expect them to lag behind English until a locale is promoted to `APP_LOCALES` (which requires bringing it to parity first).

The legal document groups (`privacyPolicy.json`, `termsOfUse.json`, `childSafetyAndSexAbusePrevention.json` — one document-sized key each) are excluded from the parity gate and from agent translation; updating them per locale is a deliberate human decision. `infoPlist.json` (iOS permission strings) is in scope like any other group.

## Scripts

- `pnpm generate` — regenerate the typed catalogs from the locale JSON.
- `pnpm check:translations` — all translation checks (validity, orphan keys, missing keys, placeholder parity, plural completeness, codegen freshness). Flags: `--json` for the machine-readable report CI consumes, `--fix-stale` to mechanically delete orphan keys.
- `scripts/diffEnKeys.mjs --base <git-ref>` — list English keys added/changed/removed relative to a git ref (used by CI for the PR review comment).
- `scripts/renderPrComment.mjs` — render the sticky PR comment from the check report + diff (used by CI).
- `pnpm test` — fixture-based tests for the check scripts.

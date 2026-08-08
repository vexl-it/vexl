---
name: adding-translation-key
description: How to add a new user-facing translation key to the Vexl app. Use whenever adding or changing user-facing strings in apps/mobile (any text passed to t(), Typography content, notification copy, etc.).
---

# Adding a translation key

Translations live in `packages/localization/locales/<locale>/<group>.json` — flat JSON with dotted keys (`"offerForm.next": "Next"`), i18next `{{variable}}` interpolation. English is the single source of truth; all other locales are machine-translated in CI by General Translation.

## Steps

1. **Add the key + English value to `packages/localization/locales/en/<group>.json` only.**
   - Pick the file matching the feature area (`offers.json`, `chat.json`, `settings.json`, `marketplace.json`, …). The key's first dot-segment should fit the file's existing key families.
   - Only create a new group file if the string clearly belongs to a new feature area no existing file covers. New file names must contain no hyphens.
   - Place the key next to related keys, not at the end of the file.
2. **Run `pnpm generate` in `packages/localization`.** This regenerates `src/translations.ts`, which makes the key available (and type-checked) at `t()` call sites. Commit the generated file together with the JSON change. CI (`check:translations`) fails if they are out of sync.
3. **Never run any `gt` CLI command** (`gt translate`, `gt upload`, `gt save-local`, …). Translation into other locales happens automatically in CI after merge (the workflow opens a `chore/translations-sync` PR). Missing translations fall back to English in the meantime — that is expected.

## Rules

- Do NOT add the key to non-English locale files — they are machine-generated. Do not hand-edit them when adding keys.
- Do NOT edit `src/translations.ts` or `src/extraTranslations.ts` by hand; only `pnpm generate` writes them.
- For countable strings, add i18next plural keys `key_one` and `key_other` (English needs only these two) instead of a bare key, and pass `{count: n}` at the call site. Note in your summary that Czech/Slovak/Polish `_few`/`_many` forms need manual follow-up — General Translation only generates the plural categories present in English.
- Reuse an existing key if the exact string already exists for the same meaning (search `locales/en/` first) rather than duplicating it.

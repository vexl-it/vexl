---
name: adding-translation-key
description: How to add or change a user-facing string in the Vexl app and translate it into all shipped locales. Use whenever adding or modifying user-facing strings in apps/mobile (any text passed to t(), Typography content, notification copy, etc.).
---

# Adding or changing a translation key

Translations live in `packages/localization/locales/<locale>/<group>.json` — flat JSON with literal dotted keys (`"offerForm.next": "Next"`), i18next `{{variable}}` interpolation. English is the source of truth for meaning, and agents write every shipped locale themselves: a PR that adds or changes copy carries its own translations, and CI blocks it otherwise.

## Steps

1. **Write the English copy in `packages/localization/locales/en/<group>.json`.**
   - New copy must follow the Vexl voice — `docs/brand-narrative/` (start with `voice-and-personality.md` and `terminology-and-glossary.md`).
   - Reuse an existing key if the exact string already exists for the same meaning (search `locales/en/` first).
   - Pick the file matching the feature area (`offers.json`, `chat.json`, `settings.json`, …); the key's first dot-segment should fit the file's existing key families. Only create a new group file for a genuinely new feature area, with no hyphens in the name. Place the key next to related keys, not at the end of the file.
2. **Run `pnpm generate` in `packages/localization`** and commit the regenerated `src/translations.ts` together with the JSON — that makes the key available and type-checked at `t()` call sites.
3. **Translate.** Spawn one translator subagent covering the new/changed keys across all shipped locales — model, prompt contents, and translator rules are in `docs/translating.md`. A _changed_ English value counts exactly like a new key: the existing translations are now stale, re-translate them.
4. **Verify.** Run `pnpm check:translations` in `packages/localization`; done means no error names one of your keys.

## Rules

- For countable strings, `en` gets `key_one` + `key_other` (never a bare key) with `{count: n}` at the call site; the translator subagent owes each locale its full CLDR plural set (`docs/translating.md`).
- `src/translations.ts` and `src/extraTranslations.ts` are generated — only `pnpm generate` writes them.
- The legal document groups (`privacyPolicy`, `termsOfUse`, `childSafetyAndSexAbusePrevention`) are exempt from agent translation. If you change one, say so in your summary — translating legal text is a human decision per locale.

---
name: sync-localization-translations
description: Coordinate parallel agents to synchronize Vexl localization locale files with packages/localization/base.json. Use when filling missing translation keys, refreshing stale locale JSON files, or ensuring every *-base.json language file has complete translated values using en-base.json as the preferred source text.
---

# Sync Localization Translations

Synchronize `packages/localization/*-base.json` files with the master key list in `packages/localization/base.json` by spawning one worker agent per locale file. Each worker owns exactly one language file and translates missing or placeholder values from the preferred source text.

## Quick Start

From the repository root, inspect the locale work plan and generate compact worker prompts:

```bash
yarn tsx .agents/skills/sync-localization-translations/scripts/list-locale-work.ts
yarn tsx .agents/skills/sync-localization-translations/scripts/list-locale-work.ts --prompts
```

Fetch missing translations for one locale in a small batch:

```bash
yarn tsx .agents/skills/sync-localization-translations/scripts/get-missing-translations.ts cs --limit 25
```

Upsert completed translations without manually editing the locale file:

```bash
yarn tsx .agents/skills/sync-localization-translations/scripts/upsert-translations.ts cs --input /tmp/cs-translations.json
```

## Workflow

1. Run the helper script to list locale files and missing-key counts.
2. Spawn one worker agent per `packages/localization/*-base.json` file that needs work. Include the generated prompt for that file.
3. Tell every worker that it is not alone in the codebase, owns only its assigned locale file, and must not revert or edit files touched by others.
4. Workers must not open whole locale JSON files for translation work. They should repeatedly call `get-missing-translations.ts <locale> --limit 25 --offset <n>` to fetch compact batches.
5. For each returned key, workers translate `sourceTranslation`. The `enBaseTranslation` is the final English translation when present; when it is missing or empty, `sourceTranslation` falls back to the `baseTranslation`.
6. Workers must write completed batches through `upsert-translations.ts <locale> --input <json-file-or-stdin>`, not by manually editing the locale file.
7. Workers must translate values into the assigned locale in an informal, friendly voice, like talking to a friend. Use informal second-person forms where the language distinguishes them, such as Czech `tykani` instead of `vykani`; apply the equivalent familiar tone in other languages.
8. Workers must preserve placeholders, punctuation that is part of interpolation syntax, line breaks, markdown markers, URLs, app/product names, and ICU-like tokens exactly.
9. After workers finish, run the helper script again and verify every locale reports zero missing keys.
10. Run repository verification:

```bash
yarn turbo:typecheck
yarn turbo:format
yarn turbo:lint
```

## Worker Prompt Shape

Use the helper-generated prompt when possible. If writing one manually, include:

- Assigned file path, locale code, and language name.
- Instruction to use `get-missing-translations.ts` for source strings instead of reading full JSON files.
- Instruction to translate `sourceTranslation`; `enBaseTranslation` is final if present, otherwise `baseTranslation` is the source.
- Instruction to use informal, friend-to-friend language; prefer familiar second-person forms where applicable.
- Instruction to write translations with `upsert-translations.ts` instead of manually editing the locale file.
- Instruction to preserve placeholders exactly, including single-brace variables, double-brace variables, printf tokens, positional tokens, and newline escape sequences.
- Instruction to edit only the assigned locale file.

## Script Details

`get-missing-translations.ts` returns JSON shaped for small translation batches:

```bash
yarn tsx .agents/skills/sync-localization-translations/scripts/get-missing-translations.ts <locale-code|locale-file> --limit 25 --offset 0
```

Each item includes `key`, `enBaseTranslation`, `baseTranslation`, `sourceTranslation`, and `sourceFile`. Translate only `sourceTranslation`.

`upsert-translations.ts` accepts a JSON object or array and rewrites the target locale file in `base.json` key order:

```bash
yarn tsx .agents/skills/sync-localization-translations/scripts/upsert-translations.ts <locale-code|locale-file> --input <translations.json>
```

The input may be a key/value object, an array of `{key, value}` objects, or `{ "translations": ... }`. Use `--input -` to read from stdin.

## Notes

- `base.json` is the master key list. Do not change it during a sync unless the user explicitly asks to add or remove source strings.
- `en-base.json` is a locale file too. Its values should be English and it should still contain every key from `base.json`.
- If the agent runtime cannot spawn workers, process files sequentially using the same per-file ownership rules.

# Spawning translator subagents

Shared reference for the `adding-translation-key` and `translation-audit` skills: how an agent delegates Vexl string translation to subagents. Translation is always subagent work — the orchestrating agent prepares inputs and verifies, it does not translate.

## Model by harness

Spawn through the current harness's native subagent mechanism, with the model that harness runs cheapest at quality:

| Harness       | Translator model            |
| ------------- | --------------------------- |
| Claude Code   | Opus                        |
| Cursor        | Gemini Flash                |
| Codex / GPT   | sol                         |
| anything else | inherit the session default |

## Fan-out

- **New or changed keys in a PR** (inline flow): spawn **one** subagent carrying all keys and all target locales — one mind keeps terminology consistent across locales for the same string.
- **Audit** (full parity repair): spawn one subagent **per locale**, in parallel — each carries only its locale's gap list.

## Target locales

The shipped locales are `APP_LOCALES` in `packages/localization/scripts/generateTranslations.mjs`; translate into every one of them except `en`. `EXTRA_LOCALES` are committed but unshipped and are never translated (see `packages/localization/README.md`).

## The subagent's prompt must carry

1. An instruction to read `docs/brand-narrative/translator-brief.md` **first** — voice, glossary, the terms that are never translated.
2. The work items: for each key, its group file, the key, and the English value (for a changed key, the old English value too, so the subagent sees what shifted).
3. The target locale(s).
4. The translator rules below, or a pointer to this section.

## Translator rules

- Write translations directly into `packages/localization/locales/<locale>/<group>.json`, placing each key at the same position it has in the `en` file.
- Keep `{{placeholder}}` names verbatim; a translation may drop `{{count}}` in a singular form, but must never introduce a placeholder `en` doesn't have.
- **Plurals**: `en` carries only `_one`/`_other`. Each locale owes a form for every CLDR cardinal category of its language — look them up with `node -e "console.log(new Intl.PluralRules('cs').resolvedOptions().pluralCategories)"`. CI enforces this.
- The legal document groups (`privacyPolicy`, `termsOfUse`, `childSafetyAndSexAbusePrevention`) are never auto-translated; `infoPlist` is in scope like any other group.

## Verify

After the subagent(s) finish, run `pnpm check:translations` in `packages/localization`. Done means no error names one of your keys — baseline errors from before your change may remain until the repo-wide cleanup lands.

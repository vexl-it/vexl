---
name: translation-audit
description: Translations audit — fill missing keys in every shipped locale, re-translate keys whose English changed, delete stale ones, flag suspicious values.
disable-model-invocation: true
---

# Translation audit

Brings every shipped locale to parity with English. Scripts do the mechanical work; subagents only translate. All commands run in `packages/localization`.

The marker file `packages/localization/translation-audit.json` (`lastAuditCommit`, `lastAuditAt`) records the commit up to which English changes have translation parity.

## Steps

1. **Mode**: read the marker file and ask the user which audit to run:
   - **Diff audit** (default when the marker exists and its commit is reachable — verify with `git cat-file -e <lastAuditCommit>`): covers everything since the marker.
   - **Full audit** (default when there is no marker or its commit is unreachable): everything, plus the suspicious-value sweep.
2. **Stale cleanup**: run `pnpm check:translations --fix-stale` — mechanically deletes orphan keys and stray locale files. Record what it removed for the final report.
3. **Scope**: run `pnpm check:translations --json` and group the `missingKey`, `missingPluralForm`, and `placeholderMismatch` errors by locale. On a diff audit, additionally run `node scripts/diffEnKeys.mjs --base <lastAuditCommit>` — its `changed` keys need re-translation in every shipped locale (the old translations render the old meaning), and its `added` keys should already appear as `missingKey` errors.
4. **Fan out**: spawn translator subagents — model, prompt contents, and translator rules are in `docs/translating.md`. Per-locale in parallel, each with its locale's work items and the English values (for changed keys, old and new). When the whole scope is a handful of keys, one subagent covering all locales does the job instead. On a **full audit only**, spawn per-locale for every shipped locale (even gapless ones) and have each subagent sweep all of its locale's files and _report_ (never rewrite) suspicious values: strings still in English, or reading machine-glued.
5. **Verify**: re-run `pnpm check:translations` and dispatch follow-up fixes until it exits clean. `legalDocs` entries in the JSON report are informational, not errors — legal documents are never auto-translated.
6. **Update the marker**: write the current `git rev-parse HEAD` and ISO timestamp into `translation-audit.json`; commit it together with the translations. Both modes earn this — a green diff audit covers everything since the previous marker.
7. **Report** to the user: keys translated per locale, keys re-translated for changed English, stale keys deleted, suspicious values flagged (full audit), and the legal-document parity status from the report.

---
name: translation-audit
description: Full translations audit — fill missing keys in every shipped locale, delete stale ones, flag suspicious values.
disable-model-invocation: true
---

# Translation audit

Brings every shipped locale to parity with English. Scripts do the mechanical work; subagents only translate. All commands run in `packages/localization`.

## Steps

1. **Stale cleanup**: run `pnpm check:translations --fix-stale` — mechanically deletes orphan keys and stray locale files. Record what it removed for the final report.
2. **Gap list**: run `pnpm check:translations --json` and group the `missingKey`, `missingPluralForm`, and `placeholderMismatch` errors by locale.
3. **Fan out**: spawn one translator subagent per locale with a gap, in parallel — each gets its locale's error list with the English values; model, prompt contents, and translator rules are in `docs/translating.md`. Each subagent additionally _reports_ (never rewrites) suspicious values in its locale: strings still in English, or reading machine-glued.
4. **Verify**: re-run `pnpm check:translations` and dispatch follow-up fixes until it exits clean. `legalDocs` entries in the JSON report are informational, not errors — legal documents are never auto-translated.
5. **Report** to the user: keys translated per locale, stale keys deleted, suspicious values flagged, and the legal-document parity status from the report.

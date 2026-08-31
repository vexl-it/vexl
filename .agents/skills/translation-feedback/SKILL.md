---
name: translation-feedback
description: Record translation-quality feedback as a durable rule in the brand narrative. Use when the user reports a wrong or unnatural translation, or a preferred rendering of a term in some locale.
---

# Translation feedback

Turns "this translation is wrong" into a durable rule, so every future translator subagent gets it right. The docs are the translators' only memory — a rule that isn't written down is lost by the next audit.

## Steps

1. **Pin the rule down.** Interview the user until you can state the rule in one sentence carrying: the English source term or string, the wrong rendering, the correct rendering, the affected locale(s), and the reason (naturalness, terminology, tone). Ask focused questions with your best-guess recommendation attached; keep going until nothing is ambiguous. Done means the user confirms your one-sentence statement of the rule — not before.
2. **Place it.** `docs/brand-narrative/translator-brief.md` is the canonical home: a locale-specific directive for locale-scoped rules, a glossary entry for term-wide ones — always with the wrong→right example. Before writing, check existing entries for contradictions: when the new rule is an exception to a standing rule (e.g. a global term ban), state the exception explicitly in both places instead of leaving them contradicting.
3. **Mirror where needed.** Update `terminology-and-glossary.md` when English-side writers or copy auditors need to know the sanctioned rendering, and `audit-checklist.md` when one of its checkboxes would now false-positive on it.
4. **Sweep existing strings.** Grep `packages/localization/locales/<locale>/` for the wrong rendering, report the hits, and fix them if the user wants: a plain term swap is a direct edit; anything needing real rephrasing goes to a translator subagent per `docs/translating.md`.
5. **Finish.** Run `pnpm exec prettier --write` on the touched docs and show the user the final rule text as written.

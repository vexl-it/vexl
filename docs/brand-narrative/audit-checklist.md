# Copy Audit Checklist

A structured pass for reviewing existing copy — a single string, a screen, a notification, a landing page, or a whole flow. Designed to be usable by a human reviewer **or** an AI agent.

---

## How to run an audit

1. Read the copy in context (where does it appear? what's the user doing/feeling?).
2. Run the checklist below in order. Terminology first — it catches the most violations fastest.
3. For each issue, note: **the problem**, **which rule it breaks** (link the file), and **a suggested rewrite**.
4. Classify severity: **Blocker** (wrong meaning / forbidden term / unsafe), **Should-fix** (off-voice), **Nice-to-have** (polish).

---

## Step 1 — Terminology (fast, objective)

> Reference: [`terminology-and-glossary.md`](./terminology-and-glossary.md)

- [ ] **No "Vexlak / Vexlaks / Vexler / vexlers"** unless truly unavoidable. → "people", "users", "the other person", "friends and friends of friends".
- [ ] **No "counterparty".** → "the other person".
- [ ] **No "other side / the other side".** → "the other person".
- [ ] **Bitcoin capitalization** correct: "Bitcoin" = network/idea; "bitcoin" = the money/asset; "BTC" = unit next to numbers; "sats" lowercase.
- [ ] **No institutional verbs** (dispatch, authenticate, provision, facilitate, utilize, leverage).
- [ ] **No hype/FOMO** ("don't miss out", "act now", "limited time").
- [ ] **"Vexl"** spelled with capital V; named sections/Clubs/Foundation cased correctly.

## Step 2 — Voice & personality

> Reference: [`voice-and-personality.md`](./voice-and-personality.md)

- [ ] **Human, not institutional** — would a real person say this to a friend? Could it appear verbatim on a bank app? (If yes → rewrite.)
- [ ] Uses **"you"/"we"** and contractions where natural.
- [ ] **Active voice**, not passive evasion.
- [ ] Tone matches context (warm in onboarding; plain in money/safety; bold in marketing).

## Step 3 — Control & privacy framing

> Reference: [`dos-and-donts.md`](./dos-and-donts.md) #2–#3, [`narrative-playbook.md`](./narrative-playbook.md)

- [ ] Keeps the user **in control** ("unless you choose to", "until you decide").
- [ ] **No gatekeeping language** about users (approve, verify, permit, validate, grant access).
- [ ] Privacy framed as **practical optionality**, not paranoia or ideology.

## Step 4 — Clarity (especially for newcomers)

> Reference: [`README.md`](./README.md) (audience), [`terminology-and-glossary.md`](./terminology-and-glossary.md) (concepts to explain)

- [ ] A **newcomer** would understand every word. Jargon (KYC, on-chain, sats, private key) is explained or avoided.
- [ ] **One idea per sentence** in UI copy. No filler ("simply", "just", "in order to", "please note that").
- [ ] If there's a joke, the meaning is **100% clear without it**.

## Step 5 — Money & safety (when applicable)

> Reference: [`dos-and-donts.md`](./dos-and-donts.md) #5–#6

- [ ] Critical actions (send funds, reveal identity, delete data) are **plain and direct** — no jokes, no ambiguity.
- [ ] Errors say **what happened + what to do next**, and **don't blame** the user.
- [ ] Irreversible actions clearly flag that they can't be undone.

## Step 6 — Mechanics & polish

> Reference: [`dos-and-donts.md`](./dos-and-donts.md) #10–#11

- [ ] **Sentence case** (not Title Case / ALL CAPS). Acronyms exempt.
- [ ] Emoji (if any) is **sparing and purposeful**; none in serious money/safety/error copy.
- [ ] Tight, front-loaded, no padding.
- [ ] Punctuation clean; exclamation marks rationed.

---

## Output format (for reports / agents)

For each flagged item, produce a row like:

```
[Severity] "<original string>"
  Issue:   <what's wrong>
  Rule:    <file#section>
  Rewrite: "<suggested replacement>"
```

Example:

```
[Blocker] "Reach {count} vexlaks"
  Issue:   Uses forbidden term "vexlaks"; not newcomer-friendly.
  Rule:    terminology-and-glossary.md → Forbidden terms
  Rewrite: "You reach {count} people"

[Should-fix] "matches the counterparty's declared identity"
  Issue:   "counterparty" sounds institutional.
  Rule:    terminology-and-glossary.md → Forbidden terms
  Rewrite: "matches the other person's stated identity"

[Should-fix] "Buy Bitcoin"
  Issue:   The asset you buy is lowercase "bitcoin".
  Rule:    terminology-and-glossary.md → Bitcoin capitalization
  Rewrite: "Buy bitcoin"
```

---

## Prompt for an AI agent (copy-paste)

> You are auditing Vexl copy. Read every file in `docs/brand-narrative/`. Then review the copy I give you string by string. For each issue, output `[Severity] original → rewrite` with the rule it breaks. Check, in order: (1) forbidden terms — **never** "Vexlak/Vexler", "counterparty", or "other side"; (2) Bitcoin capitalization — "Bitcoin" network/idea vs "bitcoin" the money; (3) human-not-institutional voice; (4) user-in-control / no gatekeeping; (5) newcomer clarity; (6) plain & blameless money/safety/error copy; (7) sentence case + sparing emoji. The north star: **sound human, not like a bank.** Be specific and always propose a concrete rewrite.

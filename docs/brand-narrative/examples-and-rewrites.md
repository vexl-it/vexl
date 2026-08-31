# Examples & Rewrites

Real Vexl copy, sorted into **what's already great** (emulate it) and **what to fix** (real strings from the current app, with rewrites). All "fix" examples are pulled from the live English locale files (`packages/localization/locales/en/<group>.json`) — they're genuine audit findings, not hypotheticals.

---

## Copy that already nails the voice (emulate this)

These are doing it right — keep this bar.

| String                                                                                                      | Why it works                                            |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| "Take back your freedom to transact"                                                                        | Empowering, rebel spirit, no jargon. Pure narrative 2.  |
| "Trade bitcoin with people you know. No one watching."                                                      | Human, plain, privacy-as-default.                       |
| "Your number stays private unless you choose to share it."                                                  | Textbook "privacy = optionality" + control language.    |
| "We'll text you a code to confirm it's really you."                                                         | Sounds like a person, not an auth system.               |
| "You're in! Let's find friends on Vexl"                                                                     | Warm, celebratory onboarding.                           |
| "You're early"                                                                                              | Reframes an empty marketplace as a feature, with charm. |
| "Are you using a VPN? Try disabling it. Didn't work? Reach out to our support."                             | Error copy that helps instead of blaming.               |
| "Always money before BTC."                                                                                  | Safety copy: short, plain, unmissable.                  |
| "Your name should be long enough to beat a goldfish's memory, but short enough to fit in a fortune cookie…" | Cheeky but the constraint is still crystal clear.       |
| Terms: "law dictates that we must be more precise, so let's get it over with"                               | Legal copy that's unmistakably human.                   |

---

## Fixes — terminology: "vexlak(s)"

The app is full of "vexlaks". Every one is a fix. Pattern: replace with "people" / "users".

| ❌ Current                                                                                                                            | ✅ Rewrite                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| "Reach {count} vexlaks"                                                                                                               | "Reach {count} people"                                                                                                  |
| "You reach {count} people" _(already good in some keys)_                                                                              | keep                                                                                                                    |
| "No vexlaks"                                                                                                                          | "No people yet"                                                                                                         |
| "for {count} vexlaks" (encryption progress)                                                                                           | "for {count} people"                                                                                                    |
| "Anonymously delivered to {count} vexlaks"                                                                                            | "Anonymously delivered to {count} people"                                                                               |
| "It seems you don't reach any vexlaks to encrypt your offer for. Please add more contacts or join Vexl clubs to increase your reach." | "It looks like there's no one to encrypt your offer for yet. Add more contacts or join a Vexl Club to grow your reach." |
| "No vexlaks found for your offer"                                                                                                     | "No one found for your offer yet"                                                                                       |
| "After this date, the offer won't be visible to other vexlaks."                                                                       | "After this date, your offer won't be visible to other people."                                                         |
| "and start trading with other Vexlaks"                                                                                                | "and start trading with people you know"                                                                                |

---

## Fixes — terminology: "counterparty" / "other side"

| ❌ Current                                                                                                                      | ✅ Rewrite                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| "the counterparty has your phone number saved in their contact list"                                                            | "the other person has your phone number saved in their contacts"                    |
| "Always verify that the name of the account holder you received the payment from matches the counterparty's declared identity." | "Always check that the name on the payment matches what the other person told you." |
| "If you reveal your identity, you will see your counterparty's identity too."                                                   | "If you reveal your identity, you'll see the other person's too."                   |
| "Other person" _(common.otherSide — value is fine, key name is legacy)_                                                         | keep the value; the value already follows the rule                                  |
| "Other person canceled the request"                                                                                             | "The other person canceled the request"                                             |

---

## Fixes — Bitcoin capitalization

Rule: the asset you buy/sell/send is lowercase **bitcoin**; the network/idea is **Bitcoin**.

| ❌ Current                                                           | ✅ Rewrite                                                    |
| -------------------------------------------------------------------- | ------------------------------------------------------------- |
| "Buy Bitcoin" / "Sell Bitcoin" (buttons)                             | "Buy bitcoin" / "Sell bitcoin"                                |
| "I want to buy bitcoin" _(already correct)_                          | keep                                                          |
| "Want BTC" / "Offering bitcoin" (inconsistent within the same group) | pick one register: "Want bitcoin" / "Selling bitcoin"         |
| "This is a club offer." + "Bitcoin as it should be" (marketing)      | "Bitcoin" stays capital when it's the idea/movement — correct |

> Note: "BTC" next to a number is fine and often clearer ("0.05 BTC", "1 BTC = …"). The fix is specifically the prose word "Bitcoin" vs "bitcoin".

---

## Fixes — sounding institutional

| ❌ Current-ish pattern                                           | ✅ More human                                                                |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| "We couldn't authorize your request. Please contact support."    | "We couldn't verify that request. Get in touch with support and we'll help." |
| "Unexpected server response"                                     | "Something went wrong on our end. Try again in a moment."                    |
| "Unable to approve. The other person has deleted their account." | "Can't continue — the other person deleted their account."                   |
| "User with this phone number already exists"                     | "There's already an account with this number."                               |

_(Some of these are deep system/error strings — fix where they're user-facing; leave purely diagnostic logs alone.)_

---

## Marketing / social starters (on-narrative)

Use these as seeds; they bake the narratives in.

- "You don't need privacy until you suddenly do."
- "If someone can block you, you're not free."
- "Bitcoin doesn't need permission. Neither should the apps around it."
- "No middlemen, no drama — just people trading with people."
- "This is how people actually buy bitcoin without KYC."
- "Trade bitcoin privately." _(lead tagline)_

---

## A worked example: writing a new empty state

**Brief:** user opened Chats with no conversations yet.

- **Draft 1 (too flat):** "You have no conversations."
- **Draft 2 (institutional):** "No active conversations are currently associated with your account."
- **Draft 3 (Vexl):** "No chats yet. React to an offer and start talking — it's how every trade begins."

Why draft 3: human, encouraging, tells the user the next step, no jargon, sentence case, no forbidden terms.

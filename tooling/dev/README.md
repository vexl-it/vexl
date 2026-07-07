# @vexl-next/dev

Scripts for running the local dev stack (`dev-backend.ts`, `dev-infra.ts`, `dev-mobile.ts` — wired to `pnpm dev:backend` and friends in the root package.json).

## seed-perf-data.ts — simulate a heavy account for performance work

Seeds the **locally running** dev backend with fake users, contacts, offers, and chats around one real (emulator) user, so the app can be profiled against a realistically heavy account. This tooling was built for the investigation documented in [docs/performance_findings_2026_07.md](../../docs/performance_findings_2026_07.md).

The fake users authenticate with headers signed by the committed dev server keys from the repo-root `dev.config.ts` (phone hashes use the dev HMAC key `VexlVexl`, matching the mobile `local` env preset), so no OTP flow is needed and the hashes line up with what the app computes.

### Prerequisites

- Local backend running: `pnpm dev:backend`
- Mobile app running against the `local` env preset
- An emulator user you control, logged in with `TARGET_PHONE` (dummy OTP `222222` on the local backend)

### Phases

Phases must run in this order, interleaved with in-app steps. Each phase persists progress to the seed files and can be safely re-run to retry failures.

1. `--phase register` — creates `N_USERS` fake users on contact-service and imports their contacts. "Direct" fake users import `TARGET_PHONE` plus a few fake neighbours; "indirect" ones import only direct users, making them the target's 2nd-degree connections. Writes `seed-users.json` and `seed-fake-numbers.json`.
2. **In app**: log in as `TARGET_PHONE` and import the direct fake numbers (`numbersToImportInApp` from `seed-fake-numbers.json`) — the DebugScreen button **"Seed perf: import 200 fake contacts"** does exactly this for the default `N_USERS=300`. The target must be fully onboarded before the next phase, otherwise the fake users' offers cannot be encrypted for them. Do NOT import the `secondDegreeOnlyNumbers` — they stay 2nd degree.
3. `--phase offers` — every fake user creates `OFFERS_PER_USER` offers (connection level ALL) encrypted for their 1st+2nd degree connections, which includes the target. Each offer gets its own inbox on chat-service.
4. **In app**: the target creates at least one own offer.
5. `--phase chats` — `N_CHATS` fake users find the target's own offers (any offer not created by this script) and send messaging requests to them.
6. **In app**: approve the incoming requests — the DebugScreen button **"Seed perf: approve all chat requests"** approves every pending request at once.
7. `--phase messages` — each fake user with an approved chat sends `MSGS_PER_CHAT` messages to the target's offer inbox. Unapproved chats are reported and skipped (approve them and re-run).

`--phase verify` is a read-only sanity check that prints connection/offer counts for a few sample fake users.

### Usage

From the repo root, with the backend running:

```sh
TARGET_PHONE=+420605123456 pnpm exec tsx tooling/dev/seed-perf-data.ts --phase register
```

Parameters via env vars:

| Variable                                | Default                                        | Meaning                                              |
| --------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `TARGET_PHONE`                          | — (required for `register`)                    | E164 phone of the real emulator user                 |
| `N_USERS`                               | `300`                                          | Number of fake users (2/3 direct, 1/3 second-degree) |
| `OFFERS_PER_USER`                       | `2`                                            | Offers each fake user creates in `offers`            |
| `N_CHATS`                               | `30`                                           | Messaging requests sent to the target in `chats`     |
| `MSGS_PER_CHAT`                         | `40`                                           | Messages per approved chat in `messages`             |
| `CONCURRENCY`                           | `10`                                           | Parallel API calls                                   |
| `SEED_DIR`                              | `<os tmpdir>/vexl-seed-perf-data`              | Where the seed state files are written               |
| `CONTACT_MS` / `OFFER_MS` / `CHAT_MS`   | `http://localhost:<port>` from `dev.config.ts` | Service URL overrides                                |
| `I_KNOW_WHAT_I_AM_DOING_SEEDING_REMOTE` | — (unset)                                      | Escape hatch to bypass the local-only guard          |

The script refuses to run unless every service URL host is local (`localhost`, `*.localhost`, `127.0.0.1`, or `::1`) — this prevents accidentally seeding hundreds of fake users into a shared/staging/prod backend via the `*_MS` overrides. Set `I_KNOW_WHAT_I_AM_DOING_SEEDING_REMOTE=1` only if you truly intend to target a remote backend; it prints a loud warning and proceeds.

### Output files

Written to `SEED_DIR`:

- `seed-users.json` — key material for all fake users plus offer/chat progress state (this is what makes phases resumable; delete it to regenerate keys from scratch)
- `seed-fake-numbers.json` — `numbersToImportInApp` (direct fakes the emulator user should import) and `secondDegreeOnlyNumbers` (must NOT be imported)

### Resetting

Restart the backend with a fresh database and delete the seed files:

```sh
pnpm dev:backend --fresh-db
```

### DebugScreen helpers

Two buttons in `apps/mobile/src/components/DebugScreen/index.tsx` pair with the script:

- **Seed perf: import 200 fake contacts** — adds the direct fake numbers (`+420777000000`…`+420777000199`) to stored contacts and submits them (step 2 above)
- **Seed perf: approve all chat requests** — approves all pending incoming messaging requests (step 6 above)

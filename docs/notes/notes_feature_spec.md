# Notes (Community Board) — Feature Specification

Status: **approved, pre-implementation**
Figma: [Vexl redesign DEV — "Notes" section](https://www.figma.com/design/P7IaNcwu4qoS9uTL7ECiWL/Vexl-redesign-DEV?node-id=40003326-64664&m=dev) (node `40003326:64664`, 25 frames)

## 1. Overview

Notes are short (max 500 chars), ephemeral, text-only posts shared with the user's
social network on the **Board** tab of the Community section (currently a "Coming
soon" placeholder). Per the intro sheet copy: *"Your space to share with friends and
contacts. Post updates, ask for help, or plan meetups."*

Notes deliberately mirror **offers** in their security and distribution model:

- Content is **client-side encrypted**; the server only ever stores ciphertext.
- A note is fanned out to the author's **1st and 2nd degree contacts** (always both;
  there is no audience picker and **clubs are excluded** — decided for v1).
- Notes are **immutable** — no update path. The only owner mutation is delete.
- New chats can be started from a note, using the **same chat-request code paths as
  offers** (accept/decline gating, throwaway inbox keypairs).
- Notes **expire** after an author-chosen 1, 3, or 7 days and are then hard-deleted
  server-side. No refresh/extend mechanism (v1 decision).
- Notes can be **reposted** (only when the author allowed it) — a reposter spreads
  the note to their own 1st + 2nd degree contacts. Reposts are undoable until expiry.
  Deleting a note deletes all reposts with it.
- Notes can be **reported** (anonymous, clone of offer reporting).

### Decisions log (2026-07-02)

1. **Backend lives in `offer-service`** (new tables + endpoints), not a new service.
2. Audience is **always 1st + 2nd degree contacts**, no clubs in v1.
3. Repost = reposter re-encrypts the note's symmetric key to their own contacts as
   new private parts on the same server note row (details in §4). Repost chains are
   allowed (a repost recipient may repost again, if `allowRepost`).
4. Expiry is a fixed choice of 1/3/7 days, hard delete after expiry, no refresh.

## 2. Cryptographic model

Identical two-layer envelope as offers (see `packages/resources-utils/src/offers/`):

- On create, the client generates:
  - `noteId` — public random UUID.
  - `adminId` — secret capability token (bearer credential for delete). Stored
    server-side only deterministically AES-encrypted (same `hashAdminId` pattern
    with `EAS_KEY`), and in plaintext only inside the author's own private payload.
  - `symmetricKey` — per-note AES key.
  - a fresh **note keypair**; its public key (`notePublicKey`) goes into the public
    payload and is what responders encrypt chat requests to. The private key stays
    on the author's device (chat inbox, same as offer keypairs).
- **Public payload** (note text, `notePublicKey`, `allowRepost`, author client
  version, notification token): AES-GCM encrypted once with `symmetricKey`
  (`encryptOfferPublicPayload` pattern, version prefix `'0'`).
- **Private payloads**: one per recipient public key, containing `symmetricKey`,
  `friendLevel`, `commonFriends`, and (owner's own payload only) `adminId`.
  Encrypted per recipient: V2 keys → libsodium `cryptoBoxSeal` (prefix `'1'`),
  legacy V1 → ECIES (prefix `'0'`) — via the existing `encryptPrivatePart`.
- Decrypt mirrors `decryptOffer`: decrypt own private part → extract `symmetricKey`
  → decrypt public payload → assemble `NoteInfo`.

What the server can and cannot see:

| Server sees (plaintext) | Server cannot see |
|---|---|
| `noteId`, encrypted payload blobs | note text, author identity/keys |
| recipient public keys (fan-out targets) | who the author is among them |
| `expiresAt` timestamp (needed for cleanup) | chosen audience semantics |
| that *some authenticated user* uploaded repost parts for note N | repost provenance shown to users (inside encrypted payloads) |
| report counters | reporter ↔ note content linkage |

The `expiresAt` timestamp and the repost write pattern are the only new
server-visible metadata compared to offers; both were reviewed and accepted
(comparable to what offer creation/refresh already reveals).

## 3. Domain model (`packages/domain/src/general/notes.ts`)

Reuses from `offers.ts`: `SymmetricKey`, `FriendLevel`, `ConnectionLevel`,
`PrivatePayloadEncrypted` (V1/V2 prefix brands), `PublicPayloadEncrypted`.

New schemas:

- `NoteId` (+ `newNoteId()`), `NoteAdminId` (+ `generateNoteAdminId()`),
  `NoteRepostId` (+ `generateNoteRepostId()`) — all branded random UUIDs.
  `NoteRepostId` is the secret capability for undoing a repost, analogous to
  `adminId` for delete.
- `NOTE_TEXT_MAX_LENGTH = 500`.
- `NotePublicPart`:
  - `notePublicKey: PublicKeyPemBase64`
  - `text: Schema.String` (≤ 500 chars)
  - `allowRepost: Schema.Boolean`
  - `vexlNotificationToken` (optional — push for incoming chat requests)
  - `authorClientVersion` (optional `SemverString`)
- `NotePrivatePart`:
  - `commonFriends: HashedPhoneNumber[]`
  - `friendLevel: FriendLevel[]` (`FIRST_DEGREE`/`SECOND_DEGREE`; `NOT_SPECIFIED`
    for repost recipients — see §4)
  - `symmetricKey: SymmetricKey`
  - `viaRepost: boolean` (default false) — drives the "Reposted" tag
  - `adminId?: NoteAdminId` (owner's own payload only)
- `NoteInfo`: `{id: IdNumeric, noteId, privatePart, publicPart, expiresAt: IsoDatetimeString, createdAt, modifiedAt}`
- `NoteFlags`: `{reported: boolean}`
- `NoteOwnershipInfo`: `{adminId: NoteAdminId}`
- `NoteRepostInfo`: `{repostId: NoteRepostId, repostedAt}` — stored locally by the
  reposter (drives "You reposted" + undo).
- `OneNoteInState`: `{noteInfo, flags, ownershipInfo?, repostInfo?}`;
  `MyNoteInState` with required `ownershipInfo`.

Chat integration (in `messaging.ts`):

- `ChatOrigin` gains `{type: 'myNote', noteId, note?}` and
  `{type: 'theirNote', noteId, note?}` variants.
- `Inbox` gains optional `noteId` / `requestNoteId` (mirroring `offerId` /
  `requestOfferId`).

## 4. Reposting

A recipient already holds the note's `symmetricKey` (from their private payload), so:

1. Reposter's client checks `allowRepost` (client-enforced — the server cannot read
   the flag since it is encrypted; same trust model as other offer semantics).
2. Client generates a secret `repostId`, fetches its own 1st + 2nd degree contacts,
   and constructs private payloads for them: same `symmetricKey`,
   `viaRepost: true`, `friendLevel: ['NOT_SPECIFIED']`, `commonFriends: []`
   (the reposter cannot compute the recipient↔author relationship; the UI shows a
   generic "Reposted" tag instead of a trust tier for these).
3. Client calls `repostNote(noteId, repostId, privateParts[])`. The server attaches
   the parts to the existing `note_public` row, tagged with the encrypted
   `repostId`.
4. **Undo repost** (allowed until expiry): `undoRepostNote(repostId)` deletes
   exactly the parts tagged with that repostId.
5. **Cascade**: `note_private.note_id` is a FK with `ON DELETE CASCADE`, so
   deleting the note (owner's `deleteNote(adminId)`) or expiry cleanup removes all
   direct and reposted parts at once.
6. **Duplicates are allowed**: a user may receive the same note directly *and* via
   one or more reposts → multiple `note_private` rows for the same
   `(note_id, user_public_key)`. There is deliberately **no unique constraint**, so
   undoing a repost never removes access that was also granted directly. The client
   dedupes by `noteId`, preferring a non-`viaRepost` part.
7. Repost chains: recipients of a repost may repost again (if `allowRepost`);
   mechanically identical.

Requests to chat always go to the **author** (`notePublicKey` is in the public
payload), regardless of how the note reached the responder.

## 5. Backend (`apps/offer-service`)

### Tables (new migration)

- `note_public`:
  - `id` bigint PK (internal)
  - `admin_id` text — deterministic AES-encrypted adminId (same `hashAdminId` util)
  - `note_id` uuid (public identifier)
  - `payload_public` text
  - `expires_at` timestamp — plaintext, drives read filter + hard-delete cleanup;
    server validates it is ≤ now + 7 days (+ small slack) on create
  - `report` int counter
  - `update_counter` bigint from the shared `offer_change_counter_seq`-style sequence
- `note_private`:
  - `id` bigint PK
  - `user_public_key` text (recipient)
  - `note_id` bigint FK → `note_public.id` **ON DELETE CASCADE**
  - `payload_private` text
  - `repost_id` text nullable — deterministic AES-encrypted repostId (null for the
    author's original fan-out)
  - `update_counter` bigint (same sequence)
  - composite index `(user_public_key, update_counter, id)` for keyset pagination
- `note_reported_record`: reporter public key + timestamp (report rate-limiting,
  clone of `offer_reported_record`).

### Endpoints (added to offer-service; specs in `packages/rest-api/src/services/offer/`)

| Endpoint | Method/Path | Auth | Notes |
|---|---|---|---|
| `createNewNote` | `POST /api/v1/notes` | security headers | public payload + expiresAt + first batch of private parts; validates owner key present, no dup keys within the batch |
| `createNotePrivatePart` | `POST /api/v1/notes/private-part` | adminId or repostId bearer | subsequent batches (batch size 500, same as offers) |
| `deleteNote` | `DELETE /api/v1/notes` | adminId bearer | cascades to all private parts (incl. reposts) |
| `repostNote` | `POST /api/v1/notes/repost` | security headers | noteId + repostId + private parts; parts tagged with encrypted repostId |
| `undoRepostNote` | `DELETE /api/v1/notes/repost` | repostId bearer | deletes only parts with that repostId |
| `getNotesForMeModifiedOrCreatedAfterPaginated` | `GET /api/v1/notes/me/modified/paginated` | security headers | keyset pagination on `GREATEST(public.update_counter, private.update_counter)`; filters expired + over-report-threshold |
| `getRemovedNotes` | `POST /api/v1/notes/not-exist` | security headers | client sends known noteIds → server returns the gone ones (deletion/expiry sync) |
| `reportNote` | `POST /api/v1/notes/report` | security headers, rate-limited | increments report counter; over threshold hides the note |

Wire contracts: `ServerNote {id, noteId, expiresAt, publicPayload, privatePayload, createdAt, modifiedAt}`,
`ServerNotePrivatePart {userPublicKey, payloadPrivate}` — clones of the offer
contracts.

Infra reuse: `withDbTransaction`, `makeEndpointEffect`, `ServerSecurityMiddleware`,
`ServerCrypto`, Redis locks (`noteAdminAction:<hashedAdminId>`), rate limiting,
base64url pagination tokens. All cleanup runs on self-scheduled BullMQ
repeatable jobs (`makeRepeatingTaskLayer` from server-utils; schedule lives in
Redis, one dedicated queue per task, Redis-lock guarded so a single replica
runs each tick) — no external cron/ops wiring: expired notes are hard-deleted
every `CLEAN_EXPIRED_NOTES_INTERVAL_MS` (default 1 h) and stale
offer/note reported records are purged every
`CLEAN_REPORTED_RECORDS_INTERVAL_MS` (default 24 h). The former
`/clean-reported-records` internal endpoint (and offer-service's internal
server) was removed; contact-service's `/clean-reported-club-records` was
likewise replaced by a repeating task.

## 6. Client resource layer (`packages/resources-utils/src/notes/`)

Mirrors `offers/`, reusing the shared crypto utils:

- `createNewNoteForMyContacts` — generate symmetricKey + adminId + note keypair;
  encrypt public payload; fetch FIRST + SECOND contacts (always both, no clubs —
  thin variant of `fetchContactsForOffer`); construct + encrypt private payloads
  including the owner's own (with adminId); batched upload with rollback on failure.
- `decryptNote` — V1/V2 private-part decrypt → symmetricKey → public payload.
- `deleteNote`, `reportNote`.
- `repostNote` — generate repostId, fetch own FIRST + SECOND contacts, construct
  `viaRepost` payloads, batched upload; returns `NoteRepostInfo` for local storage.
- `undoRepost`.

## 7. Mobile app (`apps/mobile`)

### State (jotai + MMKV, clone of `state/marketplace/atoms/offersState.ts`)

- `notesStateAtom` (`atomWithParsedMmkvStorage('notes', …)`), `notesAtom`,
  `myNotesAtom` (by `ownershipInfo`), `singleNoteAtom`, `noteForChatOriginAtom`.
- Action atoms: create, delete (confirm dialog), repost/undoRepost (persist
  `repostInfo` locally), report.
- `refreshNotesActionAtom`: paginated fetch + decrypt + `getRemovedNotes` sync;
  hooked into the same triggers as offer refresh (app resume/login task,
  pull-to-refresh). Dedupe multiple private parts per noteId (prefer direct part).
- One-time intro sheet flag in persisted preferences.

### Screens (Figma frame → implementation)

| Screen | Frames | Key elements |
|---|---|---|
| Board tab (replaces `BoardScreen` placeholder) | 01, 03, 04, 20 | `All notes`/`My notes` pills, FlashList of cards (identicon avatar, trust tier — "Direct friend"/"Friend of friend", common-friends count, expiry countdown, text, "You reposted"/"Reposted" tags), gold "+ New note" FAB, per-filter empty states |
| Intro sheet (first visit) | 02 | "Community board" / "Got it" |
| Create note | 05, 06 | 500-char textarea + counter, expiry radios (7/3/1 days), "Allow repost" checkbox, "Post note" → toast |
| Note detail — mine | 07, 08 | red "Delete note" + confirm dialog |
| Note detail — theirs | 10, 17–19, 21–22 | common friends row with avatars, Repost/Undo repost, Report (+ dialog/toast), gold "Send message" |
| Send message | 11, 12 | note pinned on top, 500-char response, "already responded" guard banner |
| Author accept/decline | 14 | responder info + their message + original note + Accept/Decline |
| Chat | 13, 15, 16, 23–25 | pinned "…response to note" strip, declined states via existing Vexl-bot flow |

The trust-tier label on cards is derived from `friendLevel`; repost-delivered notes
show "Reposted" instead of a tier (see §4.2). "Already responded" is derived from
local chats having an origin with that noteId.

### Chat from note

Reuses the entire generic chat stack (`packages/resources-utils/src/chat/*`,
`sendRequestActionAtom`, `createNewChatsFromFirstMessagesActionAtom`,
accept/decline atoms). New glue only:

- `ChatOrigin` note variants + `noteForChatOriginAtom`.
- Inbox creation for the note keypair on note create (author side), throwaway
  inbox for the responder (existing `upsertInboxOnBeAndLocallyActionAtom`).
- UI: pinned note strip in chat, note shown in the request detail sheet.

When a note is deleted/expires, existing chats survive (same behavior as deleted
offers) — the origin's embedded note snapshot is kept locally for display.

### Localization

All new copy under `community.board.*` / `notes.*` keys in
`packages/localization` (en-base + base, translated files follow the repo's
translation workflow). Existing `community.board.comingSoon*` keys are removed
with the placeholder.

## 8. Out of scope for v1

- Clubs as a note audience.
- Editing notes (immutable by design).
- Refreshing/extending expiry.
- Server-side enforcement of `allowRepost` (impossible by design — flag is
  encrypted; enforced by clients).
- Images or rich content in notes (text only, 500 chars).

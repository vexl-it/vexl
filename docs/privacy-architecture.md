# Vexl privacy and data-handling overview

## Phone numbers
- Mobile normalizes device contacts into E.164 format before hashing, ensuring numbers are validated consistently across regions.
  - Normalization helper enforces valid E.164 strings and exposes safe conversion utilities.【F:packages/domain/src/general/E164PhoneNumber.brand.ts†L6-L55】
- The mobile app hashes normalized numbers client-side with an HMAC-based helper; the result is stored alongside the contact metadata on device.【F:apps/mobile/src/state/contacts/utils.ts†L35-L51】【F:apps/mobile/src/state/contacts/domain.ts†L16-L58】
- When contacts are uploaded, the contact service re-hashes the client hash with PBKDF2 and a server salt, tagging the value with a `ServerHash:` prefix and rejecting pre-hashed inputs to avoid double hashing.【F:apps/contact-service/src/utils/serverHashContact.ts†L11-L53】
- For sharing connection hints back to clients, the server derives a third hash (`ServerToClientHash:`) from the server-hashed value so clients can match common friends without learning each other’s server-side identifiers.【F:apps/contact-service/src/utils/serverHashContact.ts†L55-L92】

## Social graph construction
- Contact uploads convert each submitted client hash into a server hash, tie it to the uploader’s own server hash, and store the directed edge only if it is new (or replace all when requested).【F:apps/contact-service/src/routes/contacts/importContacts.ts†L24-L133】
- The contact database API centers on hashed identifiers, offering queries for first-/second-level contacts and common friends without exposing raw numbers or names.【F:apps/contact-service/src/db/ContactDbService/index.ts†L48-L160】
- Mutual-connection lookups take a set of target public keys, find overlapping contacts for the requester, then convert the stored server hashes back into client-comparable hashes before returning them.【F:apps/contact-service/src/routes/contacts/fetchCommonConnections.ts†L18-L52】【F:apps/contact-service/src/routes/contacts/fetchCommonConnectionsPaginated.ts†L26-L78】
- A user’s “reach” is built from deduped first- and second-level public keys fetched from the contact graph, with counts returned in the pagination metadata.【F:apps/contact-service/src/routes/contacts/fetchMyContacts.ts†L31-L72】

## What Vexl servers see vs. what stays private
- Servers receive only hashed phone numbers: the login handler hashes the submitted phone number before storing verification state, and the contact pipeline stores server-hashed contact edges instead of raw numbers.【F:apps/user-service/src/routes/login/handlers/initVerificationHandler.ts†L95-L184】【F:apps/contact-service/src/routes/contacts/importContacts.ts†L24-L120】
- User identities on the graph are keyed by public keys or server-hashed numbers; contact and club membership queries operate on those keys rather than names or clear phone numbers.【F:apps/contact-service/src/db/ContactDbService/index.ts†L48-L160】【F:apps/contact-service/src/routes/clubs/member/getClubContacts.ts†L21-L54】
- Sensitive payloads (offers, chats, club content) are encrypted client-side using shared cryptography helpers that wrap AES-GCM/CTR with PBKDF2-derived keys and HMAC utilities for integrity.【F:packages/cryptography/src/operations/aes.ts†L7-L192】【F:packages/cryptography/src/operations/hmac.ts†L4-L28】
- Stored verification state, including hashed phone numbers and temporary SMS codes, lives in Redis with expirations rather than a persistent Postgres table, aligning with the current login flow’s short-lived state model.【F:apps/user-service/src/routes/login/db/verificationStateDb.ts†L13-L152】

## Club architecture, moderation, and privacy
- Clubs are created by admins through the contact service; creation checks for existing UUIDs and records metadata like limits and validity windows in the clubs database.【F:apps/contact-service/src/routes/clubs/admin/createClub.ts†L9-L36】
- Joining a club requires an invitation code, challenge validation, and capacity checks; members are stored by public key, and moderator status is set from the invite link flag.【F:apps/contact-service/src/routes/clubs/member/joinClub.ts†L20-L124】
- Members can fetch the list of other club participants, which is limited to public keys so no phone numbers or names are exposed server-side.【F:apps/contact-service/src/routes/clubs/member/getClubContacts.ts†L21-L54】
- Abuse controls track per-user report quotas and deactivate clubs that exceed report thresholds; reports hash the offer ID before storing, preventing the server from tying a report to a clear-text offer reference.【F:apps/contact-service/src/routes/clubs/member/reportClub.ts†L25-L124】

## Law-enforcement and data exposure considerations
- Material the backend can provide includes public keys, server-hashed phone identifiers, hashed contact edges, country prefixes, and activity timestamps or notification tokens already stored in service databases; raw phone numbers or contact names are absent because they are never sent or persisted in clear text.【F:apps/user-service/src/routes/login/handlers/initVerificationHandler.ts†L95-L184】【F:apps/contact-service/src/routes/contacts/importContacts.ts†L24-L120】
- Content of offers, messages, and club discussions is encrypted via the AES/PBKDF2/HMAC helpers before leaving the client, so servers cannot decrypt without client-held keys.【F:packages/cryptography/src/operations/aes.ts†L7-L192】【F:packages/cryptography/src/operations/hmac.ts†L4-L28】

## Notes on login flow
- Phone verification uses Redis-backed state for pending codes and public-key challenges, keyed by verification IDs and set with expiration timestamps; this avoids reliance on a Postgres login-state table and matches the current deployment architecture.【F:apps/user-service/src/routes/login/db/verificationStateDb.ts†L13-L152】
- During verification initiation, the handler hashes the submitted phone number, derives the country prefix, and stores the temporary verification record in Redis, ensuring the server never persists the raw number while still supporting SMS workflows.【F:apps/user-service/src/routes/login/handlers/initVerificationHandler.ts†L95-L184】

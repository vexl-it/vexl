# Privacy-aware frontend analytics

Working notes for the client-side analytics system.

- `system.md`: how the system works and what needs to be built.
- `metrics/`: the business team's metric wishlist, one file per category, refined against the code. Every metric has the same fields: refined definition, where in the code the signal exists, collection type, viability, privacy notes, and open questions where a decision is still missing.
- `open-questions.md`: the questions that need an answer from Dave or from the business team, collected in one place. Per-metric files reference these by number instead of repeating them.
- `definitions-index.md`: the shared list of journey and aggregation definitions (names, lifetimes, buckets, fields) that every metric file references.

## Constraints

1. No exact event timestamps leave the device. Day, ISO calendar week or calendar month buckets only. Durations are bucketed on the client.
2. No per-user or per-device id on the server. Every id is scoped to one journey instance or one calendar bucket and expires with it.
3. Users can opt out in settings. No sampling beyond that.

## Collection types

- **journey**: the client owns a random journeyId, and each report replaces the whole state for that id. The server keeps the latest state only. Once a journey is terminal or its window closes, the client drops the id and the server nulls it after a TTL. The last state of an abandoned journey is the churn signal.
- **aggregation**: per absolute calendar bucket the client keeps capped counters and upserts them under a random per-bucket id, flushed on app start and best effort on background. The bucket id is dropped once the bucket is closed and acknowledged.
- **backend**: already derivable from existing server metrics (see `docs/backend_stats.md`).
- **mixed**: backend totals plus a client counter for a dimension the server cannot see (typically main vs club distribution).

Both client types are the same server primitive: an upsert of a schema-validated JSON state keyed by a client-generated id, stored with day buckets and three low-cardinality columns (platform, release line, country prefix). Details in `system.md`.

## Decisions taken

- **Core action** = successful offer creation or successful messaging request. Re-requests and note-origin requests are excluded.
- **Creation class**: `main` when no clubs were selected, `both` when clubs were selected. No club-only class exists because the offer form always has a contact connection level.
- **Request class**: `club` when the offer reached the device only through a club, `main` otherwise. Classification comes from the offer, never from which screen the user came from, so no route param for the UI surface is added.
- **Country** is stored on journeys and aggregations alike (except club definitions), and the dashboard suppresses small groups.
- **Daily active users** come from the backend refresh metric only. Client activity records are weekly and monthly engaged flags with no per-day bits.
- **"Before churn" snapshots** ("Marketplace actions before churn", "Chats opened before churn", "App sessions before churn") are rejected. A per-device record overwritten on every start is a standing device profile.
- **Journey steps are uploaded immediately**; aggregations go out on app start and best effort on background. A journey's first upload can be paired by write order with backend rows such as `USER_LOGGED_IN`; that timing-join trade-off is accepted and documented in `system.md` section 8.
- **Long-lived journeys** (30 days) carry booleans and enums only, one journey per milestone, never chained. D90 retention is not built.
- **Missing data is "unknown", never churn.** MMKV is wiped on logout and data loss happens; a reinstall or re-login is a new instance.
- **Onboarding is a 7-day journey** ending at `onboardingFinished`. Activation, activation latency and D1/D7/D30 live on `registrationCohort`, a 31-day journey that starts at registration.
- **Reactivation** is a 7-day write-once `reactivationEpisode` journey carrying the gap bucket, first action type and club membership. The time to the next dormancy is computed from local markers at the next episode.
- **Owner-side and requester-side outcomes** (offer received a request, request got an answer, their latencies) use local 7-day window records per owned offer and per sent request, rolled into weekly counters. Nothing per offer or per request reaches the server.
- **Exposure journeys** enrol only campaign-like notifications (product, inactivity, new offers, marketplace ready, new contacts, club admission, new content). Chat notifications are counted in weekly counters only.
- **Minimum suppression group** is 20 reporting instances.
- **Backend DAU and WAU**: extend the existing active-users job in contact-service with 1-day and 7-day rolling windows, labelled rolling on the dashboard.
- **Club join totals** are read from the contact-service `member_count_changes` table, which already counts both join paths.
- **Notifications sent by type**: add `notificationType` to `NOTIFICATION_SENT`; no Expo ticket handling.

## Deferred, with an open question to business

- **Acquisition source** ("Registrations by acquisition source", "Activation by acquisition source", "Number of new users from events", "Activation of users from events", "Churn by acquisition source", "Reactivation by acquisition source", source slice of "Activation rate by event by channel or source"; open-questions.md Q9): no campaign, referral, UTM or install-referrer concept exists. Deep links carry no source and are handled only after login.
- **Completed trades** ("Optional question Did it go well", "Optional question Did you connect successfully", "Optional question Did this work out for you", "Number of completed trades", "Open chat to completed trade ratio", "Open chat to completed trade time", "Post-trade return rate", "Users who completed more than one trade", "Average time between trades"; open-questions.md Q10): not observable. Would need a new optional outcome question at the feedback prompt.
- **Feedback ratings** ("Optional post-chat trade feedback", "Optional question How was your experience using Vexl", "Positive or negative trade feedback"): already stored by feedback-service, out of this system.
- **Foreground session tracking** (the sessions category, "Average time spent in app per day week or month", "Sessions before reactivation"; open-questions.md Q11): needs continuous local bookkeeping.
- **First-release scope**: the CSV priority column is not a reliable input; decided later.
- **A/B variants**: no variant concept exists. "Per variant" means per prompt id, warning id or campaign uuid.

## Signals that unlock most of the list

None of the persisted markers exist today.

- Core action success points: `createOfferActionAtom` (creation class from `intendedClubs`), `sendRequestActionAtom` (request class from the offer's origin, exclude re-requests and note origins).
- Registration success in `finishLoginActionAtom`, post-login milestones in `postLoginOnboarding.ts`, contact import outcome enum from `submitContactsActionAtom`.
- Marketplace load: hook the fetch result inside `refreshOffersActionAtom`, not `loadingStateAtom`, which reports success even after a failed refresh.
- Owner inbox pull creating a `myOffer` chat from `REQUEST_MESSAGING`, and requester chat receiving approve, disapprove or first message. `receivedByServerAt` gives latency without sending timestamps.
- Club join success in `submitCodeToJoinClubActionAtom` and moderator admission in `checkForClubsAdmissionActionAtom`.
- New MMKV markers: `firstOpenAt`, `registeredAt`, `activatedAt`, `firstClubJoinedAt`, `lastCoreActionAt`, last observed notification permission state.

## Existing code findings worth fixing regardless

- `joinClub` hardcodes `contactsImported: true` (`submitCodeToJoinClubActionAtom.ts`), so the backend metric attribute is meaningless, and moderator admissions are not reported at all.
- The notification `trackingId` is per notification, so it does not breach the per-user rule, but `NOTIFICATION_SENT` and `NOTIFICATION_PROCESSED` store exact timestamps and `newChatMessageNotice.ts` reuses it as the metrics row uuid. Keep for delivery debugging, never carry into the new system.
- `reportNotificationInteraction` attaches `notificationsEnabled` and `backgroundTaskEnabled` to unrelated events.
- The offer-creation feedback (`OFFER_RATING`) is dead code in the mobile app.

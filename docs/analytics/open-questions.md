# Open questions

Questions that cannot be answered from `README.md`, `system.md`, the code, or the decisions already taken. Metric files reference the pending ones as `Open: Q<n>` and do not repeat the text.

Q1 to Q8 are answered; the outcome is recorded in `README.md` under "Decisions taken" and they are kept here only for the record.

## For Dave (engineering, answered)

### Q1: Onboarding journey lifetime and where activation lives

- Affects: "Onboarding completion and onboarding churn", "Time from download to registration", "Time from registration to activation", "First meaningful core marketplace action", "Percentage of registrations that reach activation", "D1 retention", "D7 retention", "D30 retention", "Download to registration drop-off", "Onboarding drop-off by step", "Registration to activation drop-off"
- Question: The system.md example puts `activated` on a 30-day `onboarding` journey counted from first open, so an instance that registers on day 20 has only a 10-day activation window, while "Time from registration to activation", "Percentage of registrations that reach activation" and "Registration to activation drop-off" are defined relative to registration. Should activation stay on `onboarding`, or move to `registrationCohort`, which starts at registration and already exists for "D1 retention", "D7 retention", "D30 retention"?
- Options: a) keep the system.md example: `onboarding` lives 30 days from first open, `activated` is its terminal step, `registrationCohort` carries only `d1`, `d7`, `d30`. b) `onboarding` lives 7 days and ends at `onboardingFinished`; `activatedBy`, `activationClass` and `registrationToActivation` move to `registrationCohort` (31 days from registration). The short journey may then carry the `openToRegistration` duration bucket without the long-journey restriction, and the metric files are written for this option. (Recommended)
- Answer: b

### Q2: Reactivation episode shape

- Affects: "Dormant to returning users", "Time from becoming dormant to reactivation", "Actions after reactivation", "Club user reactivation", "Time from reactivation to next dormancy"
- Question: The episode as first analysed stayed open up to 180 days so "Sessions before reactivation" and "Time from reactivation to next dormancy" could overwrite it later, which breaks the 30-day journey lifetime rule. Is a write-once episode acceptable, with "Time from reactivation to next dormancy" computed from local markers at the next episode instead?
- Options: a) `reactivationEpisode` is a 7-day, write-once journey carrying `gap`, `firstActionType`, `clubMember` and, when a `lastReactivationAt` marker exists, `previousEpisode` for "Time from reactivation to next dormancy". (Recommended) b) counters only: `reactivations` and gap buckets on `weeklyActivity`; "Actions after reactivation", "Club user reactivation" and "Time from reactivation to next dormancy" are dropped because counters cannot carry the per-episode attributes. c) do not build the reactivation category on the client; keep the backend `USER_REACTIVATED` view only.
- Answer: a

### Q3: Owner-side offer demand: local window records or plain counters

- Affects: "Number of offers receiving a request", "Number of offers receiving no request", "Time from offer creation to first request", "Chat opens per offer", and the same mechanism on the requester side for "Number of requests receiving a response", "Number of requests receiving no response", "Time from request to response"
- Question: "Offers that received a request within 7 days" needs a per-offer local record (creation time, first request, request count, deleted, paused, last inbox pull) that is evaluated at the first app start after day 7 and rolled into the counters of the offer's creation week. Is that bookkeeping acceptable, or should the first release ship plain weekly counters without the 7-day cohort?
- Options: a) local window records for owned offers and for sent requests, rolled into `marketplaceWeekly` and `chatOutcomesWeekly`; nothing per offer or per request reaches the server. (Recommended) b) plain counters only (`offersEnrolled`, `firstRequestsObserved`, `requestsAccepted`, ...) with no window and no `noRequest` / `noAnswer` / `unknown` split; "Number of offers receiving no request", "Number of requests receiving no response", "Time from offer creation to first request", "Time from request to response" and "Chat opens per offer" are then not measurable.
- Answer: a)

### Q4: Which notifications enrol an exposure journey

- Affects: "Notification to reactivation", "Notification to app opened", "Notification to marketplace opened", "Notification to offer created", "Notification to chat opened", "Performance by notification type"
- Question: Chat message notifications are frequent and their rhythm mirrors private conversations; a 7-day `exposure` journey per chat notification would be both noisy and a chat-activity fingerprint. Should exposure journeys enrol only the campaign-like types, with chat notifications counted in `notificationsWeekly` only?
- Options: a) enrol only `product`, `userInactivity`, `newOffers`, `marketplaceReady`, `newContacts`, `clubAdmission`, `newContent`; one open journey per type (and campaign) per device. (Recommended) b) also enrol `chatMessage`, at most one open journey per week, so "Notification to app opened" covers chat pushes as well.
- Answer: A)

### Q5: Minimum suppression group size

- Affects: every dashboard chart; country, campaign, prompt and club cohorts first
- Question: system.md uses 20 reporting instances as a placeholder for hiding or merging a group. What is the value for the first dashboards?
- Options: a) 20 (Recommended) b) 10, accepting that small countries and club cohorts show earlier c) 50, accepting that most non-CZ/SK country splits and most campaign rows stay hidden for a long time.
- Answer: a

### Q6: Backend source for daily and weekly "opened the app" counts

- Affects: "Daily active users", "Weekly active users", "Monthly active users", "Dormant users"
- Question: No backend metric gives unique daily or weekly users today: `USER_REFRESH` counts calls, `COUNT_OF_ACTIVE_USERS` counts a rolling 30-day window once a day. Which extension should feed the DAU and WAU lines?
- Options: a) extend the existing daily job in `apps/contact-service/src/metrics.ts` with 1-day and 7-day rolling windows over `users.refreshed_at`, reported as `COUNT_OF_ACTIVE_USERS` with a `windowDays` attribute (and the by-country row), labelled "rolling" on the dashboard. (Recommended) b) add calendar-aligned variants (UTC day, ISO week, month) computed by the same job at bucket close, matching the client buckets exactly at the cost of a second query set.
- Answer: a

### Q7: Backend source for club join totals

- Affects: "Club joins"
- Question: `USER_JOINED_CLUB_AND_IMPORTED_CONTACTS` misses moderator admissions and its `contactsImported` attribute is hardcoded to true by the client, while `memberCountChangesDb.incrementJoined` already counts both join paths per club per day for the admin stats endpoint. Which one should the dashboard read?
- Options: a) read `member_count_changes` from the contact-service database, which `apps/dashboard-app` already connects to; leave the metric row alone or drop its `contactsImported` attribute. (Recommended) b) fix the metric: report it from `addUserToTheClub` too and remove `contactsImported`; dashboard reads the metrics table.
- Answer: a)

### Q8: Provider acceptance for notifications sent

- Affects: "Notifications sent", "Performance by notification type"
- Question: "Notifications sent" asks for "accepted by the push provider" next to send attempts. `ExpoClientService` never reads Expo tickets or receipts today. Add ticket handling now, or only add the missing `notificationType` attribute to `NOTIFICATION_SENT`?
- Options: a) add `notificationType` to `NOTIFICATION_SENT` only; sends by type are enough for "Performance by notification type" and receipts on the client ("Notifications delivered") give the lower bound on delivery. (Recommended) b) also read Expo tickets in `ExpoClientService` and report `NOTIFICATION_PUSH_TICKET{status}`.
- Answer: a

## For business (pending)

### Q9: Acquisition source

- Affects: "Registrations by acquisition source", "Activation by acquisition source", "Number of new users from events", "Activation of users from events", "Activation rate by event by channel or source" (source slice), "Churn by acquisition source", "Reactivation by acquisition source"
- Question: No campaign, referral, link parameter or install-referrer concept exists, so every "by source" metric is deferred. Business needs to decide whether a source signal is worth an extra input, and which one.
- Options: a) do not build; the "by source" metrics are dropped and re-opened when a campaign programme exists. b) add an optional "how did you hear about Vexl" picker in onboarding with a closed list (`event`, `friend`, `social`, `press`, `organic`, `unknown`), stored on the device and copied onto the onboarding and registration journeys. (Recommended if the metrics are wanted: the only option that works on both platforms and keeps the value a small enum) c) add a `source` parameter to `app.vexl.it/link/` handled before login, which covers links only and needs the initial-URL handling moved out of the logged-in hooks.
- Answer: _pending_

### Q10: Completed trades

- Affects: "Optional question Did it go well", "Optional question Did you connect successfully", "Optional question Did this work out for you", "Number of completed trades", "Open chat to completed trade ratio", "Open chat to completed trade time", "Post-trade return rate", "Users who completed more than one trade", "Average time between trades"
- Question: Vexl cannot observe a trade. The only way to get a completion signal is one optional structured question at the existing post-chat feedback prompt, kept out of the feedback-service row and counted as client aggregation. Should that question be added, and if so which one?
- Options: a) add one question with the answers `traded`, `metNoTrade`, `noMeeting`, `preferNotToAnswer`; this unlocks "Optional question Did you connect successfully", "Number of completed trades", "Open chat to completed trade ratio", "Post-trade return rate" and "Users who completed more than one trade" as self-reported metrics, "Optional question Did it go well" and "Optional question Did this work out for you" are dropped as duplicates of the star rating, "Open chat to completed trade time" and "Average time between trades" stay unmeasurable. (Recommended) b) no new question; the whole completed-trade group stays deferred.
- Answer: _pending_

### Q11: Foreground session tracking

- Affects: "Average time spent in app per day week or month", "Sessions before reactivation", "Sessions per user", "Sessions per active user", "Session frequency", "Session duration", "Session depth", "Single-session users", "Repeat-session users", "Sessions before first marketplace action", "Sessions before first chat", "Sessions before churn"
- Question: Session metrics need a tracker that runs on every foreground and background transition, checkpoints foreground seconds to storage every 30 seconds, and keeps a short ring of session starts on the device. Is that continuous bookkeeping worth it for the session metrics, given that the activity records (active users category) already answer "who was active this week"?
- Options: a) build the tracker and ship "Sessions per user", "Sessions per active user", "Session frequency", "Session duration", "Session depth" (weekly histograms), with the first-open cohort metrics "Single-session users", "Repeat-session users", "Sessions before first marketplace action", "Sessions before first chat" as a later step. b) do not build; sessions stay deferred and the activity and retention records are the engagement measure. (Recommended)
- Answer: _pending_

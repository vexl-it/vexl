# Clubs

## Merged

| Duplicate                                              | Canonical                                         |
| ------------------------------------------------------ | ------------------------------------------------- |
| "Activation of users from Clubs"                       | "Club to main marketplace activation rate"        |
| "Club offers created"                                  | "Offers created" (`activation.md`)                |
| "Club offers reacted to"                               | "Offers reacted to" (`activation.md`)             |
| "Club chats opened"                                    | "Offers reacted to" (`activation.md`)             |
| "Club to main marketplace chat initiation rate"        | "Club to main marketplace offer reaction rate"    |
| "Time from Club join to first main marketplace action" | "Club to main marketplace activation rate"        |
| "Club to return drop-off"                              | "Retention after joining a Club" (`retention.md`) |

## Category summary

- Membership lives on the device (`clubsToKeyHolderAtom`, MMKV `STORED_CLUBS_V2_MMKV_KEY`), every membership is a fresh keypair, so first-time joiners, membership counts and every cohort here are computed on the phone.
- Two definitions: the `clubJoinCohort` journey ("Returning to a Club", "Club to contact import conversion", "Club to marketplace browsing rate", "Club to main marketplace offer view rate", "Club to main marketplace offer reaction rate", "Club to main marketplace offer creation rate", "Club to main marketplace chat initiation rate", "Club to main marketplace activation rate", "Time from Club join to first main marketplace action", "Club offer creation rate", "Club offer reaction rate", "Retention after joining a Club"), one per instance at its first club join ever, and the `clubActivityMonthly` aggregation ("Club joins", "Offers created per Club member", "Offer reactions per Club member", "Users active in more than one Club", "Average Clubs per user"). Both are club definitions: no country column, `updatedDay` at week precision for the journey, and every upload delayed to the next app start (system.md section 8).
- Weekly club activity ("Club activity", "Club offers created", "Club offers reacted to", "Club chats opened") is read from the class counters on `weeklyActivity`: `offersCreatedBoth` (creation class `both`) and `requestsSentClub` (request class `club`, from the offer origin, not from a UI surface). No club-only class exists and no route param is added.
- Two join paths succeed at different places and feed one hook: `submitCodeToJoinClubActionAtom` after `api.contact.joinClub`, and `checkForClubsAdmissionActionAtom` when a `waitingForAdmission` key moves into `data`.
- Backend: `USER_JOINED_CLUB_AND_IMPORTED_CONTACTS` is misreported (`contactsImported` hardcoded, moderator admissions missing); `member_count_changes` counts both paths.

### Club joins

- **Status: planned**.
- **Type**: mixed. Backend join actions per club. Client: aggregation `clubActivityMonthly` (month, no country), boolean `firstClubJoin`, counter `clubJoins` (cap 10).
- **Definition**: Successful join actions, and separately instances joining any club for the first time ever. Local retries are deduped by the atom (`MemberAlreadyInClubError`). Rejoining or a second club is a join action, not acquisition.
- **Where in the code**: the two success points in the summary. `everJoinedClub` marker (new) because `clubsToKeyHolderAtom` empties on leave or deactivation; seed it true at rollout when `clubsToKeyHolderAtom` or `removedClubsAtom` is non-empty.
- **Privacy notes**: the backend row carries `clubUUid` and an exact timestamp; the client record carries neither and is uploaded at the next start.

### Club activity

- **Status: planned**
- **Type**: aggregation `weeklyActivity` (week), read as `clubActive = offersCreatedBoth > 0 or requestsSentClub > 0`; no new signal.
- **Definition**: Activity = a successful creation with clubs selected or a successful request on a club-origin offer. Active instances and capped action counts are reported separately. Adding an existing offer to a club at join time is an update and is not counted.
- **Where in the code**: "Offers created" and "Offers reacted to".
- **Privacy notes**: this record carries country; the dashboard suppression rule applies to the club slices.

### Club offers created

Merged into "Offers created" (`activation.md`). Dashboard label: "creations that reached at least one club" = `offersCreatedBoth`; the CSV's "club only" bucket does not correspond to a user choice and is not built.

### Club offers reacted to

Merged into "Offers reacted to" (`activation.md`). Dashboard label: "requests on club-origin offers" = `requestsSentClub`; rows with the counter above zero give the instance rate.

### Club chats opened

Merged into "Offers reacted to" (`activation.md`). Composer opens are counted once (`composerOpened`) without a club split; initiations are "Club offers reacted to".

### Returning to a Club

- **Status: planned**
- **Type**: journey `clubJoinCohort`, lifetime 31 days from the first join ever, week precision, no country, all uploads delayed. This section defines the journey; "Club to contact import conversion", "Club to marketplace browsing rate", "Club to main marketplace offer view rate", "Club to main marketplace offer reaction rate", "Club to main marketplace offer creation rate", "Club to main marketplace chat initiation rate", "Club to main marketplace activation rate", "Time from Club join to first main marketplace action", "Club offer creation rate", "Club offer reaction rate" and "Retention after joining a Club" add fields.
- **Fields**: eligibility snapshot at join `hadImportedContacts`, `hadBrowsedMain` (`true`, `false`, `unknown`), `hadMainRequest`, `hadCreatedOffer`, `hadActivated`; one `DaysBucket` per milestone, written once at its first occurrence within 30 days: `returnedToClub`, `importedContacts`, `browsedMain`, `openedMainDetail`, `sentMainRequest`, `createdMainOffer`, `mainActivation`, `createdClubOffer`, `sentClubRequest`; booleans `importBeforeMainRequest`, `importBeforeCreate`, `importBeforeActivation`, `sharedExistingOfferAtJoin`, `d7Main`, `d30Main`, `d7Club`, `d30Club`.
- **Definition**: `returnedToClub` = a later foreground visit to any club screen after the join session (the app has been backgrounded since the join, or it is a later day). Visits and core club actions are separate series.
- **Where in the code**: enrol in the "Club joins" hook when `everJoinedClub` was false; `firstClubJoinedAt` marker (local, exact) is the baseline for every bucket. Visit = `useFocusEffect` on `apps/mobile/src/components/ClubDetail/index.tsx`, `ClubOffersScreen`, and the Community `Clubs` tab (`CommunityScreen/components/ClubsScreen/index.tsx`).
- **Privacy notes**: never the club uuid, club count or country; clubs are small and the dashboard suppresses cohorts below the threshold.

### Club to contact import conversion

- **Status: planned**
- **Type**: journey `clubJoinCohort`, snapshot `hadImportedContacts`, milestone `importedContacts`.
- **Definition**: Among first-time joiners with `hadImportedContacts = false`, a successful import within each window. Existing importers are excluded from the denominator and counted separately.
- **Where in the code**: snapshot = `importedContactsCountAtom > 0` (`apps/mobile/src/state/contacts/atom/contactsStore.ts`); milestone = `submitContactsActionAtom` returning `success` with `importedContactsCountAtom > 0` afterwards. The `contactsImported: true` the client sends to the backend is not a source of truth.
- **Privacy notes**: none beyond the journey.

### Club to marketplace browsing rate

- **Status: planned**
- **Type**: journey `clubJoinCohort`, snapshot `hadBrowsedMain`, milestone `browsedMain`.
- **Definition**: A later successful foreground load of the main marketplace within the window; no import required. First-time browsing is reported separately by filtering on `hadBrowsedMain = false`; installs from before the marker shipped report `unknown`.
- **Where in the code**: the "Users who see at least one offer" load hook (success path of `refreshOffersActionAtom` from `MarketplaceScreenContent`) writes the `firstMainMarketplaceLoadAt` marker, which the snapshot reads. The main list also contains club offers, so this measures the screen, not non-club content.
- **Privacy notes**: none beyond the journey.

### Club to main marketplace offer view rate

- **Status: planned**
- **Type**: journey `clubJoinCohort`, milestones `importedContacts` then `openedMainDetail`.
- **Definition**: Contact import followed by a main-marketplace offer detail open, among eligible joiners. Diagnostic only; "Club to main marketplace offer reaction rate" is the stronger funnel over the same two signals.
- **Where in the code**: `OfferDetailScreen` mount where the offer is not club-only (`requestClass(friendLevel) === 'main'`). Ordering is checked locally by comparing the two milestone times before bucketing.
- **Privacy notes**: none beyond the journey.

### Club to main marketplace offer reaction rate

- **Status: planned**
- **Type**: journey `clubJoinCohort`, snapshot `hadMainRequest`, milestone `sentMainRequest`, boolean `importBeforeMainRequest`. Canonical for "Club to main marketplace chat initiation rate".
- **Definition**: Among joiners without a prior main request, a successful import followed by a successful main-class request within the window. Kept apart from the general main-request rate.
- **Where in the code**: `sendRequestActionAtom` success with request class `main`. Snapshot: any chat in `messagingStateAtom` with `origin.type === 'theirOffer'` whose offer is not club-only, or `idsOfRequestedOffersAtom` non-empty.
- **Privacy notes**: none beyond the journey.

### Club to main marketplace offer creation rate

- **Status: planned**
- **Type**: journey `clubJoinCohort`, snapshot `hadCreatedOffer`, milestone `createdMainOffer`, boolean `importBeforeCreate`.
- **Definition**: Same eligible cohort; import followed by a successful creation. Every creation is encrypted for the contact network, so any creation class counts once.
- **Where in the code**: `createOfferActionAtom` success. Snapshot: `hasPostedFirstOfferActionStepAtom` (`myOffers.ts`) or `accountStatsAtom.postedOffers > 0`.
- **Privacy notes**: none beyond the journey.

### Club to main marketplace chat initiation rate

Merged into "Club to main marketplace offer reaction rate". Chat initiation is the successful initial request; a composer open is not initiation.

### Club to main marketplace activation rate

- **Status: planned**
- **Type**: journey `clubJoinCohort`, snapshot `hadActivated`, milestone `mainActivation` (`DaysBucket`), boolean `importBeforeActivation`. Canonical for "Activation of users from Clubs" and "Time from Club join to first main marketplace action".
- **Definition**: Among first-time joiners not yet activated at join, the first main-class core action after join within 1, 7 and 30 days (the `DaysBucket` values `d0`, `d1`, `d2To7`, `d8To30`). The bucket is also the latency of "Time from Club join to first main marketplace action". The import requirement is the separate "import-assisted" view via `importBeforeActivation`, not a prerequisite. It is a club-join cohort, not an acquisition source.
- **Where in the code**: `hadActivated` from the `activatedAt` marker; milestone set by whichever of "Club to main marketplace offer reaction rate" or "Club to main marketplace offer creation rate" comes first.
- **Privacy notes**: none beyond the journey.

### Time from Club join to first main marketplace action

Merged into "Club to main marketplace activation rate". Dashboard label: distribution of the `mainActivation` bucket over observed activators; browsing latency is the `browsedMain` bucket of "Club to marketplace browsing rate".

### Club offer creation rate

- **Status: planned**
- **Type**: mixed. First month: journey `clubJoinCohort`, milestone `createdClubOffer`, boolean `sharedExistingOfferAtJoin`. Ongoing: aggregation `clubActivityMonthly`, `clubOfferCreations` bucket filtered on `isClubMember` ("Offers created per Club member").
- **Definition**: First-time joiners who create at least one offer with clubs selected within 30 days. Sharing an existing offer at join is recorded as the boolean, not as a creation.
- **Where in the code**: `createOfferActionAtom` success with creation class `both`; `publishSelectedOffersToJoinedClubActionAtom` in `submitCodeToJoinClubActionAtom.ts` sets the boolean.
- **Privacy notes**: none beyond the journey.

### Club offer reaction rate

- **Status: planned**
- **Type**: mixed. First month: journey `clubJoinCohort`, milestone `sentClubRequest`. Ongoing: `clubActivityMonthly.clubRequests` filtered on `isClubMember` ("Offer reactions per Club member").
- **Definition**: Same cohort and window as "Club offer creation rate"; numerator is instances with at least one successful club-class request. Missing outcomes are unobserved, not zero.
- **Where in the code**: `sendRequestActionAtom` success with request class `club`.
- **Privacy notes**: none beyond the journey.

### Offers created per Club member

- **Status: planned**
- **Type**: aggregation `clubActivityMonthly` (month, no country, delayed upload). This section defines the record: booleans `isClubMember`, `firstClubJoin`; counter `clubJoins` (cap 10); buckets `membership` (`MembershipBucket`), `clubsActedIn`, `clubOfferCreations`, `clubRequests` (`CountBucket`).
- **Definition**: `clubOfferCreations` counts creations with class `both` in the month, reported as a bucket that includes zero for every reporting member instance (`isClubMember` true at report time). Means are reporter-based and capped.
- **Where in the code**: `createOfferActionAtom` success with `intendedClubs` non-empty; `isClubMember = Record.size(clubsToKeyHolderAtom) > 0` at flush. The local `stats.allOffersIdsForClub` in `clubsWithMembersAtom` counts other members' offers and is not this signal.
- **Privacy notes**: buckets, no club uuid, no country.

### Offer reactions per Club member

- **Status: planned**
- **Type**: aggregation `clubActivityMonthly`, bucket `clubRequests`.
- **Definition**: Successful club-class requests in the month over the same population as "Offers created per Club member"; requests, not distinct offers; observed zeros included. Re-requests excluded.
- **Where in the code**: `sendRequestActionAtom` success with request class `club`.
- **Privacy notes**: as "Offers created per Club member".

### Users active in more than one Club

- **Status: planned**
- **Type**: aggregation `clubActivityMonthly`, buckets `membership` and `clubsActedIn`.
- **Definition**: Membership in 2+ clubs is not activity in 2+ clubs; both buckets are reported. `clubsActedIn` counts clubs with a core action in the month; a request on an offer shared with several of my clubs counts the club the UI shows (`smallestClubForIdsAtom`).
- **Where in the code**: membership from `Record.size(clubsToKeyHolderAtom)` at flush; acted-in from a local per-month `Set<ClubUuid>` fed by `intendedClubs` and the request's club, of which only the size bucket is uploaded and which is cleared with the month.
- **Privacy notes**: the uuid set never leaves the device.

### Average Clubs per user

- **Status: planned**
- **Type**: aggregation `clubActivityMonthly`, bucket `membership` (`0`, `1`, `2To3`, `4Plus`).
- **Definition**: Current membership count at the report snapshot, over all reporting instances; "members only" is the dashboard filter on bucket above zero. Historical joins are not current membership.
- **Where in the code**: `Record.size(clubsToKeyHolderAtom)` at flush; `removedClubsAtom` (deactivated clubs kept 30 days) is not counted.
- **Privacy notes**: `4Plus` is rare; the dashboard merges it into `2To3` when the group is below the threshold.

# Activation

## Merged

| Duplicate                                                       | Canonical                                                       |
| --------------------------------------------------------------- | --------------------------------------------------------------- |
| "Onboarding completion rate"                                    | "Onboarding completion and onboarding churn" (`acquisition.md`) |
| "Activation rate by event by channel or source"                 | "Time from registration to activation" (`acquisition.md`)       |
| "Time from registration to first meaningful marketplace action" | "Time from registration to activation" (`acquisition.md`)       |
| "Percentage of registrations that reach activation"             | "Time from registration to activation" (`acquisition.md`)       |
| "Offers created during one day one week or one month"           | "Offers created"                                                |
| "Offers viewed or opened"                                       | "Offers viewed" (deferred)                                      |
| "Number of requests"                                            | "Offers reacted to"                                             |
| "Number of users who see no offers"                             | "Users who see no offers"                                       |
| "Chats opened from an offer"                                    | "Offers reacted to"                                             |
| "Chats initiated"                                               | "Offers reacted to"                                             |
| "Club offers created"                                           | "Offers created"                                                |
| "Club offers reacted to"                                        | "Offers reacted to"                                             |
| "Club chats opened"                                             | "Offers reacted to"                                             |

## Category summary

- The onboarding and activation journeys live in `acquisition.md` ("Onboarding completion and onboarding churn", "Time from registration to activation"). This file owns the per-bucket counters: contact import ("Contact import started", "Contact import completed" on `weeklyActivity`), marketplace first load ("Marketplace opened", "Users who see at least one offer", "Users who see no offers" on `marketplaceWeekly`) and the core-action counters ("Offers created", "Offers reacted to" on `weeklyActivity`) that most other files read.
- "Offers created" and "Offers reacted to" are `mixed`: backend totals from `OFFER_CREATED` and `REQUEST_SENT`, client counters for the creation class (`main`, `both`) and the request class (`main`, `club`), which the server cannot see.
- Code caveat: `loadingStateAtom` ends in `success` even after a failed refresh (`refreshOffersActionAtom` does `catchAll` then `zipLeft(set success)`), so "successful load" is taken from the fetch result inside the atom.

### Onboarding completion rate

Merged into "Onboarding completion and onboarding churn" (`acquisition.md`). Dashboard label: state whether the chart measures account setup (`registered`) or the optional contact import (`contactsImport = success`).

### Contact import started

- **Status: planned**
- **Type**: aggregation `weeklyActivity` (week). Counters (cap 20): `importStartedOnboarding`, `importStartedSettings`, `importStartedReimport`.
- **Definition**: One increment per user-initiated import attempt. "Instances with at least one start" = rows with a counter above zero. Permission denial is an outcome of "Contact import completed", not a separate start. No phone numbers, no contact counts.
- **Where in the code**: `submitContactsActionAtom` (`apps/mobile/src/state/contacts/atom/submitContactsActionAtom.ts`) is the single entry point. Callers: onboarding `ContactsImportScreen.tsx` (`onboarding`), the contact picker in `apps/mobile/src/components/ContactPreferencesFlow/components/ContactListSelect/atom.ts` (`settings`), and the reach-drop re-import in `checkUserNeedsToImportAndReencryptOffersActionAtom.ts` (`reimport`). `DebugScreen` calls are excluded.
- **Privacy notes**: never report `normalizedContactsAtom.length`, `importedContactsCountAtom` or reach next to these counters.

### Contact import completed

- **Status: planned**
- **Type**: aggregation `weeklyActivity` (week). Counters (cap 20): `importSuccess`, `importNothingNew`, `importZeroContacts`, `importPermissionDenied`, `importQuota`, `importError`.
- **Definition**: One increment per attempt outcome, on the same row as "Contact import started" so completion among starters is computable per row. `importNothingNew` is a `success` where `newContactsToImport` was empty; `importZeroContacts` is `noContactsSelected`.
- **Where in the code**: the `Effect.match` at the end of `submitContactsActionAtom`: `success`, `noContactsSelected`, `permissionsNotGranted`, `otherError`; `InitialImportContactsQuotaReachedError` and `ImportContactsQuotaReachedError` are split out of `otherError` as `importQuota`. Backend gauges `COUNT_OF_UNIQUE_USERS` and `COUNT_OF_CONNECTIONS` give the global stock, not per-period completions.
- **Privacy notes**: outcome counters only.

### Marketplace opened

- **Status: planned**
- **Type**: aggregation `marketplaceWeekly` (week). Counters (cap 50): `marketplaceOpened`, `clubOffersOpened`.
- **Definition**: The main marketplace becoming visible in the foreground, once per foreground session (a tab switch and back is one open). Background refreshes do not count. Club browsing is its own counter. Rows with `marketplaceOpened > 0` give browsing instances per week.
- **Where in the code**: the `useFocusEffect` in `AllOffersActiveEffects` (`apps/mobile/src/components/InsideRouter/components/MarketplaceScreen/components/MarketplaceScreenContent.tsx`), gated by `activeTab === 'allOffers'`; club browsing is `apps/mobile/src/components/ClubOffersScreen/index.tsx`. Dedupe with an in-memory flag reset on the `background` transition of `useAppState`. The marketplace is the initial tab, so most app opens count; that is the definition.
- **Privacy notes**: capped counter; never add the active filter, tab or `visibleSection`.

### Users who see at least one offer

- **Status: planned**
- **Type**: aggregation `marketplaceWeekly` (week). Field `firstLoadResult` (`offers`, `empty`, `notLoaded`), boolean `filteredEmptySeen`.
- **Definition**: At the first successful unfiltered marketplace load in the week record whether at least one eligible offer is visible; never overwritten within the week. `notLoaded` (the default) excludes the row from the denominator when no fetch succeeded. Filtered emptiness is the separate boolean. Country is a row column with suppression; no city.
- **Where in the code**: success path of `refreshOffersActionAtom` (`apps/mobile/src/state/marketplace/atoms/refreshOffersActionAtom/index.ts`) after `fetchOffersReportErrorsActionAtom` resolves, not `loadingStateAtom`. Visibility from `areThereOffersToSeeInMarketplaceWithoutFiltersAtom` (`offersToSeeInMarketplace.ts`); the list includes club offers. Filtered emptiness: `isMarketplaceNarrowingActiveAtom` plus `visibleMarketplaceOffersCountAtom = 0`. Only loads triggered from the marketplace screen count (the same atom runs from the background task).
- **Privacy notes**: an `empty` marketplace plus a small country plus a week is a small group; suppression handles it.

### Users who see no offers

- **Status: planned**
- **Type**: aggregation `marketplaceWeekly` (week), the `empty` value of `firstLoadResult` from "Users who see at least one offer". Canonical for "Number of users who see no offers".
- **Definition**: The complementary outcome from the same first-successful-load population, so "Users who see at least one offer" and "Users who see no offers" are mutually exclusive. API errors and user filters are not "no offers". Pending decryption is not a state: `refreshOffersActionAtom` merges decrypted offers before it resolves.
- **Where in the code**: as "Users who see at least one offer". `markMarketplaceReadyNotificationFlowAsCompletedIfOffersAreVisibleActionAtom` (`apps/mobile/src/utils/marketplaceReadyNotification/store.ts`) is an existing "first offer became visible" transition, not reused.
- **Privacy notes**: see "Users who see at least one offer".

### Offers viewed

- **Status: deferred**. CSV decision: defer until a UX question needs it. Canonical for "Offers viewed or opened".
- **Where in the code**: `apps/mobile/src/components/OfferDetailScreen/index.tsx` mount (route `OfferDetail`), excluding `ChatDetailScreen/OfferDetailScreen.tsx` and `MyOfferDetailScreen`. The mount hook is built anyway for the `engaged` flag ("Weekly active users"); a capped `offerDetailOpened` counter on `marketplaceWeekly` is the whole change if revived.

### Offers created

- **Status: planned**
- **Type**: mixed. Backend `OFFER_CREATED` (`countryPrefix`, `offerType`) for totals; aggregation `weeklyActivity` (week) counters (cap 20) `offersCreatedMain`, `offersCreatedBoth` for the creation class and for "instances with at least one". Canonical for "Offers created during one day one week or one month" (per-period totals) and "Club offers created" (creations that reached a club = `offersCreatedBoth`).
- **Definition**: One increment per successful creation, class `main` when no clubs were selected and `both` when clubs were selected (decision: no club-only class, the form always has a contact connection level). Frontend and backend counts are never summed. Publishing an existing offer to a newly joined club is an update, not a creation.
- **Where in the code**: `createOfferActionAtom` (`apps/mobile/src/state/marketplace/atoms/createOfferActionAtom.ts`) resolving; class from `creationClass(intendedClubs)` in `coreAction.ts`. The form generates `newOfferId()` per attempt and the counter bumps on resolve only, so a failed-then-retried attempt counts once locally (server-side a retry after a lost response counts twice in `OFFER_CREATED`). `publishSelectedOffersToJoinedClubActionAtom` is an `OFFER_MODIFIED` path and is excluded. Backend: `reportOfferCreated` in `apps/offer-service/src/metrics.ts`.
- **Privacy notes**: no offer type, currency, amount, location or club ids on the client counters.

### Offers reacted to

- **Status: planned**
- **Type**: mixed. Backend `REQUEST_SENT` for totals (best effort, client-declared `messageType`, includes note requests); aggregation `weeklyActivity` (week) counters (cap 20) `requestsSentMain`, `requestsSentClub`, `rerequests`, and `chatOutcomesWeekly` counter (cap 50) `composerOpened`. Canonical for "Number of requests" (number of requests), "Chats opened from an offer" (composer opens vs initiated chats), "Chats initiated" (chats initiated), "Club offers reacted to" (club-origin requests = `requestsSentClub`) and "Club chats opened" (club composer opens are not split; the initiation is "Club offers reacted to").
- **Definition**: Reaction = a successfully sent initial messaging request. Class `club` when the offer reached the device only through a club, `main` otherwise, taken from the offer's origin. Re-requests into an existing chat are `rerequests`; note requests are excluded. Rows with `requestsSent* > 0` give "instances with at least one". Distinct offers contacted is an owner-side number ("Number of offers receiving a request").
- **Where in the code**: `sendRequestActionAtom` (`apps/mobile/src/state/chat/atoms/sendRequestActionAtom.ts`) resolving; `upsertChatForTheirOfferActionAtom` takes the `createNewChat` branch for a new conversation, otherwise it is a re-request (`SendMessageScreen` `mode === 'rerequest'`). Class from `requestClass(originOffer.offerInfo.privatePart.friendLevel)` in `coreAction.ts`. Composer open = `apps/mobile/src/components/SendMessageScreen/index.tsx` mount with `mode === 'request'`. `sendRequestForNoteActionAtom` is excluded.
- **Privacy notes**: never include `offerId`, inbox keys, `commonFriends` or club uuids.

### First meaningful core marketplace action

- **Status: planned**.
- **Type**: journey `registrationCohort` (31 days), fields `activatedBy` and `activationClass` written once with the `activatedAt` marker. Specified in "Time from registration to activation".
- **Definition**: Activation = the first successful core action (offer creation or messaging request). Browsing, opening an existing chat and contact import do not activate. The class is reported and the dashboard decides whether a club request or a `both` creation counts as main-marketplace activation.
- **Where in the code**: the two success points of "Offers created" and "Offers reacted to", guarded by the `activatedAt` marker.
- **Privacy notes**: two enums, nothing about the offer or chat.

### Activation rate by event by channel or source

Merged into "Time from registration to activation" (`acquisition.md`) for the global rate and the country split (row column with suppression); the source and event slices belong to "Activation by acquisition source" (deferred, Q9). Dashboard label: one dimension per view, never event by country.

### Time from registration to first meaningful marketplace action

Merged into "Time from registration to activation" (`acquisition.md`). Dashboard label: `registrationToActivation` histogram over activators.

### Percentage of registrations that reach activation

Merged into "Time from registration to activation" (`acquisition.md`). Dashboard label: 7-day and 30-day activation rate of the same matured cohort, never a timeless "ever activated" share.

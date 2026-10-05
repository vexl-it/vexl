# Marketplace and liquidity

## Merged

| Duplicate                                             | Canonical                                   |
| ----------------------------------------------------- | ------------------------------------------- |
| "Offers created during one day one week or one month" | "Offers created" (`activation.md`)          |
| "Offers viewed or opened"                             | "Offers viewed" (`activation.md`, deferred) |
| "Number of requests"                                  | "Offers reacted to" (`activation.md`)       |
| "Number of users who see no offers"                   | "Users who see no offers" (`activation.md`) |
| "Chats that receive a response"                       | "Number of requests receiving a response"   |
| "Chats with no response"                              | "Number of requests receiving no response"  |
| "Chat opens per offer"                                | "Number of offers receiving a request"      |

## Category summary

- Supply ("Active offers", "Offers by country", "Offers by type") is backend: the hourly offer-service gauges. The server sees `country_prefix`, `offer_type` and `refreshed_at` only; `active`, `expirationDate` and location are encrypted.
- Creation and request counts are "Offers created" and "Offers reacted to". Marketplace visibility ("Average number of offers visible to users") is a field on `marketplaceWeekly`, defined here.
- Owner-side demand ("Number of offers receiving a request", "Number of offers receiving no request", "Time from offer creation to first request", "Chat opens per offer") is one local window record per owned offer, evaluated after 7 days and rolled into `marketplaceWeekly` counters keyed by the offer's creation week. Requester-side outcomes ("Number of requests receiving a response", "Number of requests receiving no response", "Time from request to response") are the same mechanism per sent request, rolled into `chatOutcomesWeekly`. Nothing per offer or per request reaches the server.
- Signal sites: `createOfferActionAtom` resolving (enrol an owned offer); `createNewChatsFromFirstMessagesActionAtom` creating a `myOffer` chat from `REQUEST_MESSAGING` (owner sees a request; `receivedByServerAt` is the request time); `sendRequestActionAtom` resolving (enrol a request; `sentMessage.receivedByServerAt` is the send time); `addMessagesToChats` delivering `APPROVE_MESSAGING`, `DISAPPROVE_MESSAGING` or a first `MESSAGE` into a `theirOffer` chat (answer).
- Chats also originate from notes (`myNote` / `theirNote` origins); every request metric filters on offer origins.

### Active offers

- **Status: planned**
- **Type**: backend. `TOTAL_BUY_OFFERS`, `TOTAL_SELL_OFFERS`, `TOTAL_OFFERS_ACROSS_ALL` (hourly gauges, `apps/offer-service/src/metrics.ts`); the dashboard takes the row closest to the daily cut.
- **Definition**: Offers refreshed within 30 days and below the report threshold. The server cannot see deactivation or the user-set expiration date, so "eligible" means exactly that, and the label says so. No main / club / both split exists server-side (`offer_public` has no distribution column).
- **Where in the code**: `queryOffersStats` groups by `country_prefix` and `offer_type` and ignores the report filter today; adding the filter that `queryTotalOffersFlagged` applies is the one backend change.
- **Privacy notes**: country by type is already reported; no finer cross-tabs.

### Offers created during one day one week or one month

Merged into "Offers created" (`activation.md`). Dashboard label: `OFFER_CREATED` totals per period next to the weekly `offersCreatedMain` / `offersCreatedBoth` split.

### Offers viewed or opened

Merged into "Offers viewed" (`activation.md`, deferred).

### Offers by country

- **Status: planned**
- **Type**: backend. `TOTAL_BUY_OFFERS` / `TOTAL_SELL_OFFERS` by `countryPrefix`, weekly.
- **Definition**: Eligible offers by the author's phone country, labelled as such: an offer located in Vienna created by a +420 number counts as CZ. Minimum group sizes apply.
- **Where in the code**: the stored country is set at creation from `getCountryPrefix(session.phoneNumber)` in `createOfferActionAtom.ts`.
- **Privacy notes**: suppress small countries; no cross with club or time of day.

### Offers by city

- **Status: deferred**. CSV decision: defer. Location is inside the encrypted public part (`OfferLocation` in `packages/domain/src/general/offers.ts`); any city report would need plaintext location on the server or a device-side geo bucket, both outside this system.

### Offers by type

- **Status: planned**
- **Type**: backend. `TOTAL_BUY_OFFERS_ACROSS_ALL` / `TOTAL_SELL_OFFERS_ACROSS_ALL`.
- **Definition**: Eligible offers split BUY / SELL under the "Active offers" rules. Listing type (BTC, product, service) is encrypted and not reported.
- **Where in the code**: `apps/offer-service/src/metrics.ts`.
- **Privacy notes**: none beyond "Active offers".

### Number of offers receiving a request

- **Status: planned**.
- **Type**: aggregation `marketplaceWeekly`, keyed by the offer's creation week. Counters (cap 20): `offersEnrolled`, `offersRequests0`, `offersRequests1`, `offersRequests2To5`, `offersRequests6Plus`, `offersDeletedBefore7d`, `offersPausedBefore7d`, `offersNotObserved`. Canonical for "Chat opens per offer".
- **Definition**: Enrol every created offer locally (`createdAt`, `requestCount`, `firstRequestAt`, `deletedAt`, `pausedAt`, `lastInboxPullAt`, keyed by `offerId`, never sent). `offersEnrolled` is bumped at creation. At the first app start after day 7 the record is evaluated once into exactly one outcome counter and deleted: a request bucket when the offer's inbox was pulled after the window closed, `offersNotObserved` when it was not, `offersDeletedBefore7d` or `offersPausedBefore7d` when the owner removed or paused it first. Enrolled minus the sum of outcomes is the "owner never came back" share.
- **Where in the code**: enrolment at `createOfferActionAtom` resolving; request observation when `createNewChatsFromFirstMessagesActionAtom` (`apps/mobile/src/state/chat/atoms/createNewChatsFromFirstMessagesActionAtom.ts`) creates a chat with `origin: {type: 'myOffer', offerId: inbox.offerId}`; inbox pull in `fetchAndStoreMessagesForInboxAtom` (`fetchNewMessagesActionAtom.ts`); deletion in `deleteOffersActionAtom`; pause = `updateOfferActionAtom` with `active: false`.
- **Privacy notes**: counters only; the creation week is the bucket, so cohorts are weekly.

### Number of offers receiving no request

- **Status: planned**.
- **Type**: aggregation `marketplaceWeekly`, the `offersRequests0`, `offersPausedBefore7d`, `offersDeletedBefore7d` and `offersNotObserved` counters of "Number of offers receiving a request".
- **Definition**: An observed zero requires an inbox pull after the window; otherwise the offer is `notObserved`. Paused and deleted offers are separated because they cannot receive requests.
- **Where in the code**: as "Number of offers receiving a request"; the observation is `fetchAndStoreMessagesForInboxAtom` returning for `inbox.offerId` after day 7.
- **Privacy notes**: as "Number of offers receiving a request".

### Number of requests

Merged into "Offers reacted to" (`activation.md`). Dashboard label: `REQUEST_SENT` totals next to the weekly `requestsSentMain` / `requestsSentClub` / `rerequests` split.

### Number of requests receiving a response

- **Status: planned**.
- **Type**: aggregation `chatOutcomesWeekly`, keyed by the request's week. This section defines the request roll-up: counters (cap 20) `requestsEnrolled`, `requestsAccepted`, `requestsRejected`, `requestsHumanReply`, `requestsCancelledByMe`, `requestsNoAnswer`, `requestsUnknown`; latency counters of "Time from request to response". Canonical for "Chats that receive a response".
- **Definition**: Enrol every sent initial request locally (`sentAt` = server accept time, `answer`, `answeredAt`, `cancelledAt`, `lastInboxPullAt`, keyed by chat id, never sent). Within 7 days classify the first explicit answer as accepted, rejected or first human reply (an accepted request that later gets a human reply counts in both `requestsAccepted` and `requestsHumanReply`). Evaluated once at the first app start after day 7 and deleted. Counted on the requester device only.
- **Where in the code**: requester chats have `origin.type === 'theirOffer'`; answers arrive through `addMessagesToChats` (`apps/mobile/src/state/chat/utils/addMessagesToChats.ts`) as `APPROVE_MESSAGING`, `DISAPPROVE_MESSAGING` or `MESSAGE`; `getRequestState` in `offerStates.ts` derives the state. `CANCEL_REQUEST_MESSAGING` sent by the requester is `requestsCancelledByMe`. Backend `REQUEST_APPROVED` / `REQUEST_REJECTED` give global totals only.
- **Privacy notes**: the local record lives with the chat and is purged with it (`checkAndDeleteOldChatsAndDataActionAtom`).

### Number of requests receiving no response

- **Status: planned**.
- **Type**: aggregation `chatOutcomesWeekly`, the `requestsNoAnswer` and `requestsUnknown` counters of "Number of requests receiving a response". Canonical for "Chats with no response".
- **Definition**: `noAnswer` only when the device pulled the request inbox after day 7 with no answer; otherwise `unknown`. Cancellation and local deletion are their own outcomes, not silence.
- **Where in the code**: as "Number of requests receiving a response"; the observation is a pull of `inbox.requestOfferId` after the window.
- **Privacy notes**: as "Number of requests receiving a response".

### Average number of offers visible to users

- **Status: planned**
- **Type**: aggregation `marketplaceWeekly` (week), field `visibleOffers` (`VisibleOffersBucket`, written with `firstLoadResult` at the first successful unfiltered load in the week). This section defines the record: counters `marketplaceOpened`, `clubOffersOpened` ("Marketplace opened"), fields `firstLoadResult`, `visibleOffers`, `filteredEmptySeen` ("Users who see at least one offer", "Users who see no offers"), and the offer demand counters ("Number of offers receiving a request", "Time from offer creation to first request").
- **Definition**: The count of eligible unfiltered offers at the first successful load in the week, as a bucket. `0` is the zero bucket of "Users who see no offers" and "Number of users who see no offers".
- **Where in the code**: `offersToSeeInMarketplaceAtom.length` inside the success path of `refreshOffersActionAtom` (after `mergeIncomingOffersToState`), not via `loadingStateAtom`. Offers are persisted in MMKV, so the merged local state is what the user sees.
- **Privacy notes**: bucket only, never the exact count.

### Number of users who see no offers

Merged into "Users who see no offers" (`activation.md`). Dashboard label: `firstLoadResult = empty` (equivalently `visibleOffers = 0`) over rows with a successful load, next to the supply totals.

### Time from offer creation to first request

- **Status: planned**.
- **Type**: aggregation `marketplaceWeekly`, counters (cap 20) `firstRequestLt1h`, `firstRequest1hTo24h`, `firstRequest1dTo3d`, `firstRequest3dTo7d` (`LatencyBucket`), written when the "Number of offers receiving a request" record is evaluated.
- **Definition**: Creation to the first request's server accept time, so it is send latency, not observation latency. Denominator = offers with an observed request.
- **Where in the code**: creation time from the local record; first request time = `receivedByServerAt` on the received `REQUEST_MESSAGING` (`messageToChatMessageWithState` in `fetchNewMessagesActionAtom.ts`).
- **Privacy notes**: bucket counters only.

### Time from request to response

- **Status: planned**.
- **Type**: aggregation `chatOutcomesWeekly`, one `LatencyBucket` counter set each for accept, reject and human reply (`acceptLt1h` ... `replyGt3d`, 12 counters, cap 20), written when the "Number of requests receiving a response" record is evaluated.
- **Definition**: Request send time to the first explicit answer of each kind, both taken from server accept times, so offline delivery does not distort it.
- **Where in the code**: `sentMessage.receivedByServerAt` from `sendMessagingRequest` in `sendRequestActionAtom.ts`; answer `receivedByServerAt` from the "Number of requests receiving a response" record. `MESSAGE_FETCHED_AND_REMOVED.messageAgeSeconds` on the backend measures pull delay and is not a substitute.
- **Privacy notes**: bucket counters only; no club or offer type dimension.

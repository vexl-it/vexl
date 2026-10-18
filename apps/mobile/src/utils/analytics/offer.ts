import {
  bucketDuration,
  bucketRequestCount,
} from '@vexl-next/analytics-definitions/src/buckets'
import {
  approvedRequestClass,
  createdOfferClass,
} from '@vexl-next/analytics-definitions/src/coreAction'
import {
  offerJourney,
  type TradeSide,
} from '@vexl-next/analytics-definitions/src/definitions/offer'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {
  type OfferId,
  type OfferType,
} from '@vexl-next/domain/src/general/offers'
import {Array, Option, pipe} from 'effect'
import messagingStateAtom from '../../state/chat/atoms/messagingStateAtom'
import {type ChatWithMessages} from '../../state/chat/domain'
import {reportAfterOpenActionAtom} from './afterOpenAction'
import {analyticsActionAtom} from './analyticsActionAtom'
import {analyticsInstancesAtom} from './atoms'
import {earliest, receivedRequestTimes} from './chatMessages'
import {reportCoreActionActionAtom} from './coreAction'
import {findOpenJourneys} from './instances'
import {reportPromptTargetReachedActionAtom} from './prompt'
import {journeyReportActionAtom} from './report'

const offerJourneyAtom = journeyReportActionAtom(offerJourney)

const tradeSide: Record<OfferType, TradeSide> = {BUY: 'buy', SELL: 'sell'}

export const reportOfferCreatedActionAtom = analyticsActionAtom(
  (
    get,
    set,
    {
      offerId,
      offerType,
      sharedToClubsCount,
    }: {offerId: OfferId; offerType: OfferType; sharedToClubsCount: number}
  ) => {
    const actionClass = createdOfferClass(sharedToClubsCount)
    set(
      offerJourneyAtom,
      {offerType: tradeSide[offerType], class: actionClass},
      {key: offerId, alwaysStart: true}
    )
    set(reportCoreActionActionAtom, {kind: 'offer', actionClass})
    set(reportAfterOpenActionAtom, 'offerCreated')
    set(reportPromptTargetReachedActionAtom, 'createOffer')
  }
)

export const reportOffersRemovedActionAtom = analyticsActionAtom(
  (get, set, offerIds: readonly OfferId[]) => {
    Array.forEach(offerIds, (offerId) => {
      set(offerJourneyAtom, {removed: true}, {key: offerId, onlyIfOpen: true})
    })
  }
)

export const reportOfferRequestsReceivedActionAtom = analyticsActionAtom(
  (
    get,
    set,
    {
      offerId,
      chats,
      newRequestTimes,
    }: {
      offerId: OfferId
      chats: readonly ChatWithMessages[]
      newRequestTimes: readonly number[]
    }
  ) => {
    const firstNewRequestAt = earliest(newRequestTimes)
    if (Option.isNone(firstNewRequestAt)) return

    // offerInfo.createdAt comes back from the server with day precision only.
    const createdAt = pipe(
      findOpenJourneys(get(analyticsInstancesAtom), offerJourney.name, offerId),
      Array.head,
      Option.flatMapNullable((journey) => journey.startedAt)
    )
    set(
      offerJourneyAtom,
      (current) => ({
        ...(Option.isNone(createdAt) ||
        Option.exists(current, (state) => state.firstRequestAfter !== undefined)
          ? {}
          : {
              firstRequestAfter: bucketDuration(
                firstNewRequestAt.value - createdAt.value
              ),
            }),
        requestsReceived: bucketRequestCount(
          receivedRequestTimes(chats).length
        ),
      }),
      {key: offerId, onlyIfOpen: true}
    )
  }
)

/** I approved or rejected a request on one of my offers. */
export const reportRequestAnsweredActionAtom = analyticsActionAtom(
  (get, set, {chat, approve}: {chat: Chat; approve: boolean}) => {
    if (chat.origin.type !== 'myOffer') return
    const offerId = chat.origin.offerId

    const firstRequestAt = pipe(
      get(messagingStateAtom),
      Array.findFirst((inbox) => inbox.inbox.offerId === offerId),
      Option.flatMap((inbox) => earliest(receivedRequestTimes(inbox.chats)))
    )
    set(
      offerJourneyAtom,
      (current) =>
        Option.isNone(firstRequestAt) ||
        Option.exists(current, (state) => state.firstAnswerAfter !== undefined)
          ? {}
          : {
              firstAnswerAfter: bucketDuration(
                Date.now() - firstRequestAt.value
              ),
            },
      {key: offerId, onlyIfOpen: true}
    )
    if (approve)
      set(reportCoreActionActionAtom, {
        kind: 'approval',
        actionClass: approvedRequestClass,
      })
  }
)

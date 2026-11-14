import {
  type OfferId,
  type OfferType,
} from '@vexl-next/domain/src/general/offers'
import {
  isQuickOffer,
  oppositeOfferType,
  type QuickConnectAmount,
} from '@vexl-next/domain/src/general/quickOffers'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Effect, Option, Order, pipe, Schema} from 'effect'
import {atom} from 'jotai'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {
  offerRerequestLimitDaysAtom,
  versionServiceAtom,
} from '../../utils/versionService/atoms'
import allChatsAtom from '../chat/atoms/allChatsAtom'
import {sendRequestHandleUIActionAtom} from '../chat/atoms/sendRequestActionAtom'
import {type ChatWithMessages} from '../chat/domain'
import {canChatBeRequested} from '../chat/utils/offerStates'
import {importedContactsHashesAtom} from '../contacts/atom/contactsStore'
import {deriveVisibleCommonFriendsForOffer} from '../marketplace/utils/visibleCommonFriends'
import {othersQuickOffersByTypeAtom} from '../quickOffers/atoms'
import {
  nextPingAllowedAt,
  QuickConnectPings,
  recordPing,
} from './quickConnectCooldown'
import {
  pickQuickConnectTarget,
  rankQuickConnectCandidates,
  type QuickConnectCandidate,
} from './selectQuickConnectTarget'

export class NoQuickConnectTargetError extends Schema.TaggedError<NoQuickConnectTargetError>(
  'NoQuickConnectTargetError'
)('NoQuickConnectTargetError', {}) {}

export class QuickConnectCooldownError extends Schema.TaggedError<QuickConnectCooldownError>(
  'QuickConnectCooldownError'
)('QuickConnectCooldownError', {}) {}

const quickConnectPingsStorageAtom = atomWithParsedMmkvStorage(
  'quickConnectPings',
  {pings: undefined},
  Schema.Struct({pings: Schema.optional(QuickConnectPings)})
)

const chatsForTheirOffersAtom = atom((get) =>
  pipe(
    get(allChatsAtom),
    Array.flatten,
    Array.filterMap((chat) =>
      chat.chat.origin.type === 'theirOffer'
        ? Option.some({origin: chat.chat.origin, chat})
        : Option.none()
    )
  )
)

const lastQuickConnectAcceptedAtAtom = atom((get): number | undefined =>
  pipe(
    get(chatsForTheirOffersAtom),
    Array.filter(({origin}) => !!origin.offer && isQuickOffer(origin.offer)),
    Array.flatMap(({chat}) => chat.messages),
    Array.filter(
      (message) =>
        message.state === 'received' &&
        message.message.messageType === 'APPROVE_MESSAGING'
    ),
    Array.map((message) => message.receivedByServerAt ?? message.message.time),
    Array.match({
      onEmpty: () => undefined,
      onNonEmpty: Array.max(Order.number),
    })
  )
)

// Everything the cooldown needs except the current time, which the UI ticks.
export const quickConnectCooldownInputsAtom = atom((get) => ({
  pings: get(quickConnectPingsStorageAtom).pings,
  lastAcceptedAt: get(lastQuickConnectAcceptedAtAtom),
  steps: get(versionServiceAtom).quickConnectPingCooldownStepsMinutes,
}))

// Keyed by what I want to do. Wanting to buy matches people's quick sell
// offers and the other way round.
export const quickConnectCandidatesAtom = atom(
  (get): Record<OfferType, readonly QuickConnectCandidate[]> => {
    const importedContactsHashes = get(importedContactsHashesAtom)
    const rerequestLimitDays = get(offerRerequestLimitDaysAtom)
    const chatByOfferId = new Map<OfferId, ChatWithMessages>(
      Array.map(
        get(chatsForTheirOffersAtom),
        ({origin, chat}) => [origin.offerId, chat] as const
      )
    )
    const othersQuickOffers = get(othersQuickOffersByTypeAtom)

    const candidatesFor = (
      iWant: OfferType
    ): readonly QuickConnectCandidate[] =>
      rankQuickConnectCandidates({
        offers: othersQuickOffers[oppositeOfferType(iWant)],
        commonFriendsCount: (offer) =>
          deriveVisibleCommonFriendsForOffer({
            offerInfo: offer.offerInfo,
            importedContactsHashes,
          }).commonFriends.length,
        canBeRequested: (offer) => {
          const chat = chatByOfferId.get(offer.offerInfo.offerId)
          return (
            !chat ||
            canChatBeRequested(chat, rerequestLimitDays).canBeRerequested
          )
        },
      })

    return {BUY: candidatesFor('BUY'), SELL: candidatesFor('SELL')}
  }
)

const sendQuickConnectPingSemaphoreAtom = atom(() =>
  Effect.unsafeMakeSemaphore(1)
)

// Runs are serialized so an overlapping send sees the ping recorded by the
// previous one and is stopped by the cooldown.
export const sendQuickConnectPingActionAtom = atom(
  null,
  (
    get,
    set,
    {
      iWant,
      amount,
    }: {readonly iWant: OfferType; readonly amount?: QuickConnectAmount}
  ) =>
    Effect.gen(function* (_) {
      const isCoolingDown = Option.isSome(
        nextPingAllowedAt({
          ...get(quickConnectCooldownInputsAtom),
          now: unixMillisecondsNow(),
        })
      )
      if (isCoolingDown) return yield* _(new QuickConnectCooldownError())

      const target = yield* _(
        pickQuickConnectTarget(
          get(quickConnectCandidatesAtom)[iWant],
          Math.random
        ),
        Effect.mapError(() => new NoQuickConnectTargetError())
      )

      const chat = yield* _(
        set(sendRequestHandleUIActionAtom, {
          text: '',
          originOffer: target.offer,
          quickConnectAmount: amount,
        })
      )

      const {pings, lastAcceptedAt} = get(quickConnectCooldownInputsAtom)
      set(quickConnectPingsStorageAtom, {
        pings: recordPing({
          pings,
          lastAcceptedAt,
          now: unixMillisecondsNow(),
          targetCommonFriendsCount: target.commonFriendsCount,
        }),
      })

      return chat
    }).pipe(get(sendQuickConnectPingSemaphoreAtom).withPermits(1))
)

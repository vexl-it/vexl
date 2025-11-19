import {Array, Effect} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import reportError from '../../../utils/reportError'
import {myOffersAtom} from '../../marketplace/atoms/myOffers'
import {sessionDataOrDummyAtom} from '../../session'
import messagingStateAtom from './messagingStateAtom'

export const checkAndDeleteEmptyInboxesWithoutOfferAtom = atom(
  null,
  (get, set) => {
    const api = get(apiAtom)
    const myOffersIds = get(myOffersAtom).map(
      (offer) => offer.offerInfo.offerId
    )
    const session = get(sessionDataOrDummyAtom)

    set(
      messagingStateAtom,
      Array.filter((one) => {
        const isInboxValid = (() => {
          // Is inbox for my session pub key
          if (
            one.inbox.privateKey.publicKeyPemBase64 ===
            session.privateKey.publicKeyPemBase64
          )
            return true

          // Inbox is for my offer that exists
          if (one.inbox.offerId && myOffersIds.includes(one.inbox.offerId))
            return true

          // In all other cases, inbox is valid only if there are open chats
          return one.chats.length > 0
        })()

        if (!isInboxValid) {
          pipe(
            api.chat.deleteInbox({
              keyPair: one.inbox.privateKey,
            }),
            Effect.catchAll((e) => {
              reportError(
                'warn',
                new Error(
                  'Failed to delete empty inbox without offer or any open chats'
                ),
                {e}
              )

              return Effect.void
            }),
            Effect.runFork
          )
        }

        return isInboxValid
      })
    )
  }
)

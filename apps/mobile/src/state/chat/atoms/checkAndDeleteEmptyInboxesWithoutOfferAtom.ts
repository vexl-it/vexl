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
        const inboxIsValid =
          // is my inbox
          one.inbox.privateKey.publicKeyPemBase64 ===
            session.privateKey.publicKeyPemBase64 ||
          (one.inbox.offerId
            ? // offer exists for that inbox
              myOffersIds.includes(one.inbox.offerId) ||
              // offer does not exist but there are non deleted chats
              (!myOffersIds.includes(one.inbox.offerId) && one.chats.length > 0)
            : false)

        if (!inboxIsValid) {
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

        return inboxIsValid
      })
    )
  }
)

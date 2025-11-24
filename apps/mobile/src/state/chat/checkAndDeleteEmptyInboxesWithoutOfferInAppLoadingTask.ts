import {Array, Effect, pipe} from 'effect'
import {apiAtom} from '../../api'
import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import reportError from '../../utils/reportError'
import {myOffersAtom} from '../marketplace/atoms/myOffers'
import {sessionDataOrDummyAtom} from '../session'
import messagingStateAtom from './atoms/messagingStateAtom'

export const checkAndDeleteEmptyInboxesWithoutOfferInAppLoadingTaskId =
  registerInAppLoadingTask({
    name: 'checkAndDeleteEmptyInboxesWithoutOffer',
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'resume',
    },
    task: (store) =>
      Effect.gen(function* (_) {
        const api = store.get(apiAtom)
        const myOffersIds = store
          .get(myOffersAtom)
          .map((offer) => offer.offerInfo.offerId)
        const session = store.get(sessionDataOrDummyAtom)

        store.set(
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
                // no need to block here
                Effect.runFork
              )
            }

            return isInboxValid
          })
        )
      }),
  })

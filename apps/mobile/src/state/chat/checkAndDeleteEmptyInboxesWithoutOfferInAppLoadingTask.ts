import {Array, Effect, Either, Schema} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {apiAtom} from '../../api'
import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import {storage} from '../../utils/mmkv/effectMmkv'
import reportError from '../../utils/reportError'
import {myOffersAtom} from '../marketplace/atoms/myOffers'
import {OFFERS_STORAGE_KEY, offersAtom} from '../marketplace/atoms/offersState'
import {myNotesAtom} from '../notes/atoms/notesState'
import {sessionDataOrDummyAtom} from '../session'
import messagingStateAtom from './atoms/messagingStateAtom'
import {fetchMessagesForAllInboxesInAppLoadingTaskId} from './fetchMessagesForAllInboxesInAppLoadingTask'

// Lightweight probe used only to tell whether the persisted offers blob holds
// any offers. It decodes just the `offers` array shape (elements stay
// `Unknown`), so it avoids the cost of fully validating every stored offer.
const PersistedOffersProbe = Schema.Struct({
  offers: Schema.Array(Schema.Unknown),
})

export const checkAndDeleteEmptyInboxesWithoutOfferInAppLoadingTaskId =
  registerInAppLoadingTask({
    name: 'checkAndDeleteEmptyInboxesWithoutOffer',
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'resume',
    },
    // Deleting an inbox is destructive and server-visible. An inbox with no own
    // offer/note and no open chats looks deletable, but that "no open chats"
    // signal is only trustworthy once this session has actually pulled pending
    // messages from the server - otherwise we could delete an inbox whose first
    // incoming message is still waiting server-side. Gate cleanup on a
    // successful full-inbox fetch: onlyIfSucceeds means a failed fetch skips
    // cleanup entirely (skipping is always safer than deleting early).
    //
    // This is correct as long as the fetch task reports completion only after a
    // real fetch. A throttle that fast-returns a no-op without fetching would
    // undermine the gate, so the fetch path must await the in-flight fetch
    // rather than resolve immediately when throttled.
    dependsOn: [
      {id: fetchMessagesForAllInboxesInAppLoadingTaskId, onlyIfSucceeds: true},
    ],
    task: (store) =>
      Effect.gen(function* (_) {
        const api = store.get(apiAtom)
        const myOffersIds = store
          .get(myOffersAtom)
          .map((offer) => offer.offerInfo.offerId)
        const myNotesIds = store
          .get(myNotesAtom)
          .map((note) => note.noteInfo.noteId)
        const session = store.get(sessionDataOrDummyAtom)

        // Safety guard: deleting an inbox is destructive and server-visible.
        // Own-offer inboxes are kept only when their offer is present in the
        // in-memory offers store. If that store is empty in memory while the
        // persisted blob still decodes to a non-empty offers list, the
        // in-memory value is transiently empty / out of sync (this exact
        // anomaly once deleted every own-offer inbox). Skip this run and let a
        // future one clean up once the two agree. A genuinely empty offers
        // store (blob absent, or decoding to an empty list) is not suspicious,
        // so cleanup still runs for hydrated accounts that have no own offers.
        const inMemoryOffersEmpty = Array.isEmptyArray(store.get(offersAtom))
        const anyInboxBelongsToOffer = pipe(
          store.get(messagingStateAtom),
          Array.some((one) => !!one.inbox.offerId)
        )
        if (inMemoryOffersEmpty && anyInboxBelongsToOffer) {
          const persistedOffersNonEmpty = pipe(
            storage.getVerified(OFFERS_STORAGE_KEY, PersistedOffersProbe),
            Either.map((persisted) =>
              Array.isNonEmptyReadonlyArray(persisted.offers)
            ),
            Either.getOrElse(() => false)
          )
          if (persistedOffersNonEmpty) {
            reportError(
              'warn',
              new Error(
                'Skipping checkAndDeleteEmptyInboxesWithoutOffer. The in-memory offers store is empty while the persisted offers blob still holds offers - offers state is transiently empty / out of sync.'
              )
            )
            return
          }
        }

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

              // Inbox is for my note that exists
              if (one.inbox.noteId && myNotesIds.includes(one.inbox.noteId))
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

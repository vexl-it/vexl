import {newOfferId, type OfferType} from '@vexl-next/domain/src/general/offers'
import {Array, Effect} from 'effect'
import {atom} from 'jotai'
import {
  defaultCurrencyAtom,
  goldenAvatarTypeAtom,
} from '../../utils/preferences'
import reportError from '../../utils/reportError'
import {upsertInboxOnBeAndLocallyActionAtom} from '../chat/hooks/useCreateInbox'
import {createOfferActionAtom} from '../marketplace/atoms/createOfferActionAtom'
import {deleteOffersActionAtom} from '../marketplace/atoms/deleteOffersActionAtom'
import {myQuickOffersAtom} from '../marketplace/atoms/myOffers'
import {sessionAtom} from '../session'
import {planQuickOffersReconciliation} from './planQuickOffersReconciliation'
import {createQuickOfferPublicPart} from './quickOfferPublicPart'

const createQuickOfferActionAtom = atom(
  null,
  (get, set, offerType: OfferType) =>
    Effect.gen(function* (_) {
      const offerId = newOfferId()
      const {inbox} = yield* _(
        set(upsertInboxOnBeAndLocallyActionAtom, {for: 'myOffer', offerId})
      )

      yield* _(
        set(createOfferActionAtom, {
          offerId,
          offerKey: inbox.privateKey,
          payloadPublic: createQuickOfferPublicPart({
            offerType,
            offerPublicKey: inbox.privateKey.publicKeyPemBase64,
            currency: get(defaultCurrencyAtom),
            goldenAvatarType: get(goldenAvatarTypeAtom),
          }),
          // Friends and friends of friends, never clubs.
          intendedConnectionLevel: 'ALL',
          intendedClubs: [],
        })
      )
    })
)

const reportReconcileError = (e: {
  readonly _tag: string
}): Effect.Effect<void> =>
  Effect.sync(() => {
    // Expected while the user has nobody to reach, retried on the next run.
    if (e._tag === 'PrivatePayloadsConstructionError') {
      console.info('Quick offers not published, no connections yet')
      return
    }
    reportError('warn', new Error('Error reconciling quick offers'), {
      errorTag: e._tag,
    })
  })

const reconcileSemaphoreAtom = atom(() => Effect.unsafeMakeSemaphore(1))

// Makes my quick offers match the stored answer and toggle. Safe to call any
// time and concurrently: runs are serialized and each one reads fresh state.
// Never fails, a failed step is retried by the next run.
export const reconcileQuickOffersActionAtom = atom(
  null,
  (get, set): Effect.Effect<void> =>
    Effect.suspend(() => {
      const session = get(sessionAtom)
      if (session.state !== 'loggedIn') return Effect.void

      const {tradingIntent, quickOffersEnabled} = session.session
      // Not asked yet, nothing to match.
      if (tradingIntent === undefined) return Effect.void

      const {toCreate, toDelete} = planQuickOffersReconciliation({
        tradingIntent,
        quickOffersEnabled,
        myQuickOffers: get(myQuickOffersAtom),
      })

      return Effect.all(
        [
          Array.isNonEmptyReadonlyArray(toDelete)
            ? set(deleteOffersActionAtom, {adminIds: [...toDelete]}).pipe(
                Effect.catchAll(reportReconcileError)
              )
            : Effect.void,
          Effect.forEach(
            toCreate,
            (offerType) =>
              set(createQuickOfferActionAtom, offerType).pipe(
                Effect.catchAll(reportReconcileError)
              ),
            {discard: true}
          ),
        ],
        {discard: true}
      )
    }).pipe(get(reconcileSemaphoreAtom).withPermits(1))
)

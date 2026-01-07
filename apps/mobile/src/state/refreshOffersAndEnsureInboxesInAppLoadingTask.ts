import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {
  effectToTaskEither,
  taskToEffect,
} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Array, Effect, Option, pipe} from 'effect'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {atom} from 'jotai'
import {apiAtom} from '../api'
import {
  InAppLoadingTaskError,
  registerInAppLoadingTask,
} from '../utils/inAppLoadingTasks'
import reportError from '../utils/reportError'
import {effectWithEnsuredBenchmark} from './ActionBenchmarks'
import {inboxesAtom} from './chat/atoms/messagingStateAtom'
import {upsertInboxOnBeAndLocallyActionAtom} from './chat/hooks/useCreateInbox'
import {myOffersAtom} from './marketplace/atoms/myOffers'
import {offersMissingOnServerAtom} from './marketplace/atoms/offersMissingOnServer'
import {updateOfferActionAtom} from './marketplace/atoms/updateOfferActionAtom'

const refreshOffersActionAtom = atom(null, (get, set) => {
  return Effect.gen(function* (_) {
    const api = get(apiAtom)
    const myOffers = get(myOffersAtom)

    const adminIds = pipe(
      myOffers,
      Array.filterMap((offer) =>
        Option.fromNullable(offer.ownershipInfo?.adminId)
      ),
      (o) => {
        console.info(`🦋 Refreshing ${o.length} offers`)
        return o
      }
    )

    if (Array.isEmptyArray(adminIds)) {
      return yield* _(Effect.fail({_tag: 'noOffersToRefresh'}))
    }

    const offerIdsOnServer = yield* _(api.offer.refreshOffer({adminIds}))

    const offerIdsOnDevice = myOffers.map((one) => one.offerInfo.offerId)
    const offerIdsNotOnServer = offerIdsOnDevice.filter(
      (oneOnDevice) => !Array.contains(offerIdsOnServer, oneOnDevice)
    )

    set(offersMissingOnServerAtom, offerIdsNotOnServer)

    console.info(`🦋 Offers refreshed`)
  }).pipe(
    Effect.catchAll((e) => {
      if (e._tag === 'noOffersToRefresh') {
        console.info('🦋 No offers to refresh')
      } else {
        console.error('🦋 🚨 Error while refreshing offers', e._tag)
        reportError('warn', new Error('Error while refreshing offers'), {e})
      }

      return Effect.fail(e)
    }),
    effectWithEnsuredBenchmark('Refresh offers')
  )
})

const recreateInboxAndUpdateOfferAtom = atom(
  null,
  (get, set, offerWithoutInbox: OneOfferInState) => {
    reportError(
      'warn',
      new Error(
        'Found offer without corresponding inbox. Trying to recreate the inbox and updating offer.'
      ),
      {}
    )
    const adminId = offerWithoutInbox.ownershipInfo?.adminId
    const intendedConnectionLevel =
      offerWithoutInbox.ownershipInfo?.intendedConnectionLevel
    const symmetricKey = offerWithoutInbox.offerInfo.privatePart.symmetricKey
    if (!adminId || !symmetricKey || !intendedConnectionLevel) {
      reportError(
        'error',
        new Error('Missing data to update offer after recreating inbox'),
        {}
      )
      return T.of(false)
    }

    return pipe(
      effectToTaskEither(
        set(upsertInboxOnBeAndLocallyActionAtom, {
          for: 'myOffer',
          offerId: offerWithoutInbox.offerInfo.offerId,
        })
      ),
      TE.chainW(({inbox}) =>
        effectToTaskEither(
          set(updateOfferActionAtom, {
            intendedClubs: offerWithoutInbox.ownershipInfo?.intendedClubs ?? [],
            payloadPublic: {
              ...offerWithoutInbox.offerInfo.publicPart,
              offerPublicKey: inbox.privateKey.publicKeyPemBase64,
            },
            symmetricKey,
            adminId,
            intendedConnectionLevel,
            updatePrivateParts: false,
          })
        )
      ),
      TE.match(
        (e) => {
          reportError(
            'error',
            new Error('Error while recreating inbox and updating offer'),
            {e}
          )
          return false
        },
        () => {
          console.info('✅ Inbox recreated and offer updated')
          return true
        }
      )
    )
  }
)
const checkOfferInboxesExistAndRecreateIfNotActionAtom = atom(
  null,
  (get, set) => {
    return Effect.gen(function* (_) {
      const inboxes = get(inboxesAtom)
      const publicKeys = inboxes.map((one) => one.privateKey.publicKeyPemBase64)

      yield* _(
        get(myOffersAtom),
        Array.filter((offer) => {
          const offerPublicKey = offer.offerInfo.publicPart.offerPublicKey
          return !publicKeys.includes(offerPublicKey)
        }),
        Array.map((offerWithoutInbox) =>
          taskToEffect(set(recreateInboxAndUpdateOfferAtom, offerWithoutInbox))
        ),
        Effect.all
      )

      return true
    }).pipe(effectWithEnsuredBenchmark('Check offer inboxes'))
  }
)

export const refreshOffersAndEnsureInboxesTaskId = registerInAppLoadingTask({
  name: 'refreshOffersAndEnsureInboxes',
  requirements: {
    requiresUserLoggedIn: true,
    runOn: 'resume',
  },
  task: (store) =>
    Effect.gen(function* (_) {
      const refreshOffers = store.set(refreshOffersActionAtom)
      const checkOfferInboxesExistAndRecreateIfNot = store.set(
        checkOfferInboxesExistAndRecreateIfNotActionAtom
      )

      yield* _(
        pipe(
          refreshOffers,
          Effect.andThen(checkOfferInboxesExistAndRecreateIfNot),
          Effect.mapError((e) => new InAppLoadingTaskError({cause: e}))
        )
      )
    }),
})

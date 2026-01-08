import {type MyOfferInState} from '@vexl-next/domain/src/general/offers'
import {mergeToBoolean} from '@vexl-next/generic-utils/src/effect-helpers/mergeToBoolean'
import {Array, Effect} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {version} from '../../utils/environment'
import {
  InAppLoadingTaskError,
  registerInAppLoadingTask,
} from '../../utils/inAppLoadingTasks'
import {refreshNotificationTaskId} from '../../utils/notifications/refreshNotificationTokenOnResumeTask'
import {showDebugNotificationIfEnabled} from '../../utils/notifications/showDebugNotificationIfEnabled'
import {reportErrorE} from '../../utils/reportError'
import {inboxesAtom} from '../chat/atoms/messagingStateAtom'
import {generateVexlTokenActionAtom} from '../notifications/actions/generateVexlTokenActionAtom'
import {ensureVexlSecretExistsTaskId} from '../notifications/ensureVexlSecretExistsTask'
import {refreshOffersAndEnsureInboxesTaskId} from '../refreshOffersAndEnsureInboxesInAppLoadingTask'
import {myOffersAtom} from './atoms/myOffers'
import {updateOfferActionAtom} from './atoms/updateOfferActionAtom'

const doesOfferNeedsUpdateNotificationToken = atom(
  null,
  (get, set): ((oneOffer: MyOfferInState) => boolean) => {
    return (oneOffer) => {
      return !!oneOffer.offerInfo.publicPart.vexlNotificationToken
    }
  }
)

const doesOfferNeedUpdateVersion = atom(
  null,
  (get, set): ((oneOffer: MyOfferInState) => boolean) => {
    return (oneOffer) => {
      return oneOffer.offerInfo.publicPart.authorClientVersion !== version
    }
  }
)

const updateOfferNotificationTokenActionAtom = atom(
  null,
  (get, set, offer: MyOfferInState) =>
    Effect.gen(function* (_) {
      const offerKey = offer.offerInfo.publicPart.offerPublicKey
      const offerKeyHolder = yield* _(
        Array.findFirst(
          get(inboxesAtom),
          (one) => one.privateKey.publicKeyPemBase64 === offerKey
        )
      )
      const vexlNotificationToken = yield* _(
        set(generateVexlTokenActionAtom, {keyHolder: offerKeyHolder.privateKey})
      )
      return yield* _(
        set(updateOfferActionAtom, {
          payloadPublic: {
            vexlNotificationToken,
            // backward compatibility #2124 remove once all clients are updated
            fcmCypher: vexlNotificationToken,
            ...offer.offerInfo.publicPart,
          },
          intendedClubs: offer.ownershipInfo.intendedClubs,
          symmetricKey: offer.offerInfo.privatePart.symmetricKey,
          adminId: offer.ownershipInfo.adminId,
          intendedConnectionLevel: offer.ownershipInfo.intendedConnectionLevel,
          updatePrivateParts: false,
        })
      )
    }).pipe(
      Effect.tapError((e) =>
        reportErrorE(
          'error',
          new Error('Error while updating offer with new notification token'),
          {e}
        )
      ),
      mergeToBoolean
    )
)

const updateOfferVersion = atom(null, (get, set, offer: MyOfferInState) =>
  Effect.gen(function* (_) {
    return yield* _(
      set(updateOfferActionAtom, {
        payloadPublic: {
          authorClientVersion: version,
          ...offer.offerInfo.publicPart,
        },
        intendedClubs: offer.ownershipInfo.intendedClubs,
        symmetricKey: offer.offerInfo.privatePart.symmetricKey,
        adminId: offer.ownershipInfo.adminId,
        intendedConnectionLevel: offer.ownershipInfo.intendedConnectionLevel,
        updatePrivateParts: false,
      })
    )
  }).pipe(
    Effect.tapError((e) =>
      reportErrorE('error', new Error('Error while updating offer version'), {
        e,
      })
    ),
    mergeToBoolean
  )
)

export const checkNotificationTokensAndVersionsAndUpdateOffersTaskId =
  registerInAppLoadingTask({
    name: 'checkNotificationTokensAndVersionsAndUpdateOffers',
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'resume',
    },
    dependsOn: [
      {id: ensureVexlSecretExistsTaskId},
      {
        id: refreshNotificationTaskId,
      },
      {id: refreshOffersAndEnsureInboxesTaskId},
    ],
    task: (store) =>
      Effect.gen(function* (_) {
        void showDebugNotificationIfEnabled({
          title: 'refreshing notification tokens offers',
          subtitle: 'checkNotificationTokensAndRefreshOffersActionAtom',
          body: 'Checking notification tokens and refreshing offers',
        })

        const offersToUpdateNotificationToken = pipe(
          store.get(myOffersAtom),
          Array.filter(store.set(doesOfferNeedsUpdateNotificationToken))
        )
        console.log(
          `Refreshing notification tokens for ${offersToUpdateNotificationToken.length} offers`
        )
        const offerUpdatesNotification = yield* _(
          pipe(
            offersToUpdateNotificationToken,
            Array.map((offer) =>
              store.set(updateOfferNotificationTokenActionAtom, offer)
            ),
            Effect.allWith({
              concurrency: 'unbounded',
            })
          )
        )

        const successNotificationCount =
          offerUpdatesNotification.filter(Boolean).length
        const failedNotificationCount =
          offerUpdatesNotification.length - successNotificationCount

        console.log(
          `Finished refreshing Notifications for offers. Successfully refreshed: ${successNotificationCount}, failed: ${failedNotificationCount}`
        )

        const offersToUpdateVersion = pipe(
          store.get(myOffersAtom),
          Array.filter(store.set(doesOfferNeedUpdateVersion))
        )
        console.log(
          `Refreshing versions for ${offersToUpdateVersion.length} offers`
        )
        const offerUpdatesVersion = yield* _(
          pipe(
            offersToUpdateVersion,
            Array.map((offer) => store.set(updateOfferVersion, offer)),
            Effect.allWith({
              concurrency: 'unbounded',
            })
          )
        )

        const successVersionCount = offerUpdatesVersion.filter(Boolean).length
        const failedVersionCount =
          offerUpdatesVersion.length - successVersionCount

        console.log(
          `Finished refreshing offers. Successfully refreshed: ${successVersionCount}, failed: ${failedVersionCount}`
        )
        void showDebugNotificationIfEnabled({
          title: 'refreshing notification tokens offers',
          subtitle: 'checkNotificationTokensAndRefreshOffersActionAtom',
          body: `Finished refreshing offers. Version: Successfully refreshed: ${successVersionCount}, failed: ${failedVersionCount}, Notification Tokens: Successfully refreshed: ${successNotificationCount}, failed: ${failedNotificationCount}`,
        })
      }).pipe(Effect.mapError((e) => new InAppLoadingTaskError({cause: e}))),
  })

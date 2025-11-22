import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type MyOfferInState} from '@vexl-next/domain/src/general/offers'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {mergeToBoolean} from '@vexl-next/generic-utils/src/effect-helpers/mergeToBoolean'
import {extractPartsOfNotificationCypher} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {Array, Effect, Option} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {version, versionCode} from '../../utils/environment'
import {
  InAppLoadingTaskError,
  registerInAppLoadingTask,
} from '../../utils/inAppLoadingTasks'
import {getNotificationTokenE} from '../../utils/notifications'
import {refreshNotificationTaskId} from '../../utils/notifications/refreshNotificationTokenOnResumeTask'
import {showDebugNotificationIfEnabled} from '../../utils/notifications/showDebugNotificationIfEnabled'
import {reportErrorE} from '../../utils/reportError'
import {inboxesAtom} from '../chat/atoms/messagingStateAtom'
import {getKeyHolderForNotificationCypherActionAtom} from '../notifications/fcmCypherToKeyHolderAtom'
import {getOrFetchNotificationServerPublicKeyActionAtomE} from '../notifications/fcmServerPublicKeyStore'
import {refreshOffersAndEnsureInboxesTaskId} from '../refreshOffersAndEnsureInboxesInAppLoadingTask'
import {myOffersAtom} from './atoms/myOffers'
import {updateOfferActionAtom} from './atoms/updateOfferActionAtom'

const doesOfferNeedUpdateActionAtom = atom(
  null,
  (
    get,
    set,
    {
      expoNotificationToken,
      publicKeyFromServer,
    }: {
      expoNotificationToken: ExpoNotificationToken
      publicKeyFromServer: PublicKeyPemBase64
    }
  ): ((oneOffer: MyOfferInState) => boolean) => {
    return (oneOffer) => {
      // No fcm cypher in offer, update it because fcmToken is clearly defined (no need to handle if fcm token)
      if (!oneOffer.offerInfo.publicPart.fcmCypher) return true

      const partsOfTheCypher = extractPartsOfNotificationCypher({
        notificationCypher: oneOffer.offerInfo.publicPart.fcmCypher,
      })
      // Cypher not valid, update it pls
      if (Option.isNone(partsOfTheCypher)) return true

      // We always want expoV2
      if (partsOfTheCypher.value.type !== 'expoV2') return true

      // If the version has changed, update the token...
      if (partsOfTheCypher.value.data.clientVersion !== versionCode) return true

      return (
        oneOffer.lastCommitedFcmToken !== expoNotificationToken ||
        partsOfTheCypher.value.data.serverPublicKey !== publicKeyFromServer ||
        !oneOffer.offerInfo.publicPart.fcmCypher ||
        !set(
          getKeyHolderForNotificationCypherActionAtom,
          oneOffer.offerInfo.publicPart.fcmCypher
        ) ||
        oneOffer.offerInfo.publicPart.authorClientVersion !== version
      )
    }
  }
)

const updateOfferNotificationTokenActionAtom = atom(
  null,
  (get, set, offer: MyOfferInState) =>
    Effect.gen(function* (_) {
      const offerKeyHolder = yield* _(
        Array.findFirst(
          get(inboxesAtom),
          (one) =>
            one.privateKey.publicKeyPemBase64 ===
            offer.offerInfo.publicPart.offerPublicKey
        )
      )

      return yield* _(
        set(updateOfferActionAtom, {
          payloadPublic: {
            ...offer.offerInfo.publicPart,
            authorClientVersion: version,
          },
          intendedClubs: offer.ownershipInfo.intendedClubs,
          symmetricKey: offer.offerInfo.privatePart.symmetricKey,
          adminId: offer.ownershipInfo.adminId,
          intendedConnectionLevel: offer.ownershipInfo.intendedConnectionLevel,
          updateFcmCypher: true,
          offerKey: offerKeyHolder.privateKey,
          updatePrivateParts: false,
        }),
        Effect.tapError((e) =>
          reportErrorE(
            'error',
            new Error('Error while updating offer with new notification token'),
            {e}
          )
        )
      )
    }).pipe(mergeToBoolean)
)

export const checkNotificationTokensAndUpdateOffersTaskId =
  registerInAppLoadingTask({
    name: 'checkNotificationTokensAndUpdateOffers',
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'resume',
    },
    dependsOn: [
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

        const notificationInfoO = Option.all({
          notificationToken: yield* _(
            getNotificationTokenE(),
            Effect.map(Option.fromNullable)
          ),
          publicKeyFromServer: yield* _(
            store.set(getOrFetchNotificationServerPublicKeyActionAtomE)
          ),
        })

        if (Option.isNone(notificationInfoO)) {
          // There is nothing to update
          console.log('Unable to refresh public key or fcm token not saved')
          void showDebugNotificationIfEnabled({
            title: 'refreshing notification tokens offers',
            subtitle: 'checkNotificationTokensAndRefreshOffersActionAtom',
            body: 'Unable to refresh public key or fcm token not saved',
          })
          return
        }

        const {notificationToken, publicKeyFromServer} = notificationInfoO.value

        const offersToUpdate = pipe(
          store.get(myOffersAtom),
          Array.filter(
            store.set(doesOfferNeedUpdateActionAtom, {
              expoNotificationToken: notificationToken,
              publicKeyFromServer,
            })
          )
        )
        void showDebugNotificationIfEnabled({
          title: 'refreshing notification tokens offers',
          subtitle: 'checkNotificationTokensAndRefreshOffersActionAtom',
          body: `Refreshing ${offersToUpdate.length} offers`,
        })

        console.log(`Refreshing ${offersToUpdate.length} offers`)

        const offerUpdates = yield* _(
          pipe(
            offersToUpdate,
            Array.map((offer) =>
              store.set(updateOfferNotificationTokenActionAtom, offer)
            ),
            Effect.allWith({
              concurrency: 'unbounded',
            })
          )
        )

        const successCount = offerUpdates.filter(Boolean).length
        const failedCount = offerUpdates.length - successCount

        console.log(
          `Finished refreshing offers. Sucessfully refreshed: ${successCount}, failed: ${failedCount}`
        )
        void showDebugNotificationIfEnabled({
          title: 'refreshing notification tokens offers',
          subtitle: 'checkNotificationTokensAndRefreshOffersActionAtom',
          body: `Finished refreshing offers. Sucessfully refreshed: ${successCount}, failed: ${failedCount}`,
        })
      }).pipe(Effect.mapError((e) => new InAppLoadingTaskError({cause: e}))),
  })

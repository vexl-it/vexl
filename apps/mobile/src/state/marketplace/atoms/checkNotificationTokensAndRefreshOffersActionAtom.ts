import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type MyOfferInState} from '@vexl-next/domain/src/general/offers'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {extractPartsOfNotificationCypher} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {updateOfferAtom} from '..'
import {version} from '../../../utils/environment'
import {getNotificationToken} from '../../../utils/notifications'
import reportError from '../../../utils/reportError'
import {inboxesAtom} from '../../chat/atoms/messagingStateAtom'
import {getKeyHolderForNotificationCypherActionAtom} from '../../notifications/fcmCypherToKeyHolderAtom'
import {getOrFetchNotificationServerPublicKeyActionAtom} from '../../notifications/fcmServerPublicKeyStore'
import {myOffersAtom} from './myOffers'

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
      if (!partsOfTheCypher) return true

      return (
        oneOffer.lastCommitedFcmToken !== expoNotificationToken ||
        partsOfTheCypher.serverPublicKey !== publicKeyFromServer ||
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

const checkNotificationTokensAndRefreshOffersActionAtom = atom(
  null,
  (get, set) => {
    console.info(
      '🦋 Notification tokens',
      'Checking notification tokens and refreshing offers'
    )

    void pipe(
      T.Do,
      T.bind('notificationToken', () => getNotificationToken()),
      T.bind('publicKeyFromServer', () =>
        set(getOrFetchNotificationServerPublicKeyActionAtom)
      ),
      T.chain(({notificationToken, publicKeyFromServer}) => {
        // There is nothing to update
        if (publicKeyFromServer._tag === 'None' || !notificationToken) {
          console.info(
            '🦋 Notification tokens',
            'Unable to refresh public key or fcm token not saved'
          )
          return T.of<boolean[]>([])
        }

        return pipe(
          get(myOffersAtom),
          A.filter(
            set(doesOfferNeedUpdateActionAtom, {
              expoNotificationToken: notificationToken,
              publicKeyFromServer: publicKeyFromServer.value,
            })
          ),
          (offers) => {
            console.info(
              '🦋 Notification tokens',
              `Refreshing ${offers.length} offers`
            )
            return offers
          },
          A.map((offer) => {
            const offerKeyHolder = get(inboxesAtom).find(
              (one) =>
                one.privateKey.publicKeyPemBase64 ===
                offer.offerInfo.publicPart.offerPublicKey
            )

            if (!offerKeyHolder) return T.of(false)

            return pipe(
              set(updateOfferAtom, {
                payloadPublic: {
                  ...offer.offerInfo.publicPart,
                  authorClientVersion: version,
                },
                symmetricKey: offer.offerInfo.privatePart.symmetricKey,
                adminId: offer.ownershipInfo.adminId,
                intendedConnectionLevel:
                  offer.ownershipInfo.intendedConnectionLevel,
                updateFcmCypher: true,
                offerKey: offerKeyHolder.privateKey,
              }),
              TE.match(
                (e) => {
                  if (e._tag !== 'NetworkError') {
                    reportError(
                      'error',
                      new Error(
                        'Error while updating offer with new notification token'
                      ),
                      {e}
                    )
                  }
                  return false
                },
                () => {
                  return true
                }
              )
            )
          }),
          A.sequence(T.ApplicativeSeq),
          T.map((a) => {
            const successCount = a.filter(Boolean).length
            const failedCount = a.length - successCount
            console.info(
              '🦋 Notification tokens',
              `Finished refreshing offers. Sucessfully refreshed: ${successCount}, failed: ${failedCount}`
            )
            return a
          })
        )
      })
    )()
  }
)

export default checkNotificationTokensAndRefreshOffersActionAtom

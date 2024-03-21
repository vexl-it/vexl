import {type OfferPublicPart} from '@vexl-next/domain/src/general/offers'
import {type FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {encryptFcmForOffer} from '@vexl-next/resources-utils/src/notifications/encryptFcmForOffer'
import type * as T from 'fp-ts/Task'
import * as TO from 'fp-ts/TaskOption'
import {type Option} from 'fp-ts/lib/Option'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {getOrFetchNotificationServerPublicKeyActionAtom} from './fcmServerPublicKeyStore'

const addFCMCypherToPublicPayloadActionAtom = atom(
  null,
  (
    set,
    get,
    {
      publicPart,
      fcmToken: fcmTokenOption,
    }: {publicPart: OfferPublicPart; fcmToken: Option<FcmToken>}
  ): T.Task<{publicPart: OfferPublicPart; tokenSuccessfullyAdded: boolean}> => {
    return pipe(
      get(getOrFetchNotificationServerPublicKeyActionAtom),
      TO.bindTo('notificationServerPublicKey'),
      TO.bind('fcmToken', () => TO.fromOption(fcmTokenOption)),
      TO.chain(({notificationServerPublicKey, fcmToken}) => {
        return TO.fromTaskEither(
          encryptFcmForOffer({
            publicKey: notificationServerPublicKey,
            fcmToken,
          })
        )
      }),
      TO.match(
        (): {publicPart: OfferPublicPart; tokenSuccessfullyAdded: boolean} => ({
          tokenSuccessfullyAdded: false,
          publicPart,
        }),
        (
          fcmCypher
        ): {publicPart: OfferPublicPart; tokenSuccessfullyAdded: boolean} => {
          return {
            tokenSuccessfullyAdded: true,
            publicPart: {...publicPart, fcmCypher} satisfies OfferPublicPart,
          }
        }
      )
    )
  }
)

export default addFCMCypherToPublicPayloadActionAtom

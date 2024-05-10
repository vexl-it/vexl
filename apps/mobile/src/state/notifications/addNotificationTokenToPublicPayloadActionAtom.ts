import {type OfferPublicPart} from '@vexl-next/domain/src/general/offers'
import {type FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {encryptFcmForOffer} from '@vexl-next/resources-utils/src/notifications/encryptFcmForOffer'
import type * as T from 'fp-ts/Task'
import * as TO from 'fp-ts/TaskOption'
import {type Option} from 'fp-ts/lib/Option'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {type PrivateKeyHolder} from './../../../../../packages/cryptography/src/KeyHolder/brands'
import {registerFcmCypherActionAtom} from './fcmCypherToKeyHolderAtom'
import {getOrFetchNotificationServerPublicKeyActionAtom} from './fcmServerPublicKeyStore'

const addFCMCypherToPublicPayloadActionAtom = atom(
  null,
  (
    get,
    set,
    {
      publicPart,
      fcmToken: fcmTokenOption,
      keyHolder,
    }: {
      publicPart: OfferPublicPart
      fcmToken: Option<FcmToken>
      keyHolder: PrivateKeyHolder
    }
  ): T.Task<{publicPart: OfferPublicPart; tokenSuccessfullyAdded: boolean}> => {
    return pipe(
      set(getOrFetchNotificationServerPublicKeyActionAtom),
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
          set(registerFcmCypherActionAtom, {
            fcmCypher,
            keyHolder,
          })

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

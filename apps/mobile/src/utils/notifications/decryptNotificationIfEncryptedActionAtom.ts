import {Schema} from '@effect/schema'
import {type FirebaseMessagingTypes} from '@react-native-firebase/messaging'
import {
  EncryptedNotificationData,
  type ChatNotificationData,
} from '@vexl-next/domain/src/general/notifications'
import {decryptChatNotificationPayload} from '@vexl-next/resources-utils/src/notifications/notificationPayloadCrypto'
import {Effect, Option} from 'effect'
import {atom} from 'jotai'
import {getKeyHolderForFcmCypherActionAtom} from '../../state/notifications/fcmCypherToKeyHolderAtom'
import reportError from '../reportError'

const decryptNotificationIfEncryptedActionAtom = atom(
  null,
  (
    get,
    set,
    data: FirebaseMessagingTypes.RemoteMessage['data']
  ): Promise<Option.Option<ChatNotificationData>> => {
    if (!data) return Promise.resolve(Option.none())

    return Effect.gen(function* (_) {
      const notificationData = yield* _(
        Schema.decodeUnknown(EncryptedNotificationData)(data)
      )
      const key = set(
        getKeyHolderForFcmCypherActionAtom,
        notificationData.targetCypher
      )
      if (!key) {
        reportError(
          'warn',
          new Error(
            'Error decrypting notification FCM - unable to find private key for cypher'
          )
        )
        return Option.none()
      }

      const decrypted = yield* _(
        decryptChatNotificationPayload(key.privateKeyPemBase64)(
          notificationData.payload
        )
      )
      return Option.some(decrypted)
    }).pipe(
      Effect.catchAll((e) => {
        if (e._tag === 'CryptoError') {
          reportError(
            'warn',
            new Error('Error decrypting notification payload'),
            {e}
          )
        }
        return Effect.succeed(Option.none())
      }),
      Effect.catchAllDefect((d) => {
        reportError(
          'warn',
          new Error('Defect decrypting notification payload'),
          {d}
        )
        return Effect.succeed(Option.none())
      }),
      Effect.runPromise
    )
  }
)

export default decryptNotificationIfEncryptedActionAtom

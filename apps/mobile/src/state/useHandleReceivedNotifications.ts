import {Schema} from '@effect/schema'
import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging'
import {useNavigation} from '@react-navigation/native'
import {
  ChatNotificationData,
  EncryptedNotificationData,
} from '@vexl-next/domain/src/general/notifications'
import {decryptChatNotificationPayload} from '@vexl-next/resources-utils/src/notifications/notificationPayloadCrypto'
import {Effect, Option} from 'effect'
import {atom, useSetAtom, useStore} from 'jotai'
import {useEffect} from 'react'
import checkAndShowCreateOfferPrompt from '../utils/notifications/checkAndShowCreateOfferPrompt'
import {
  CREATE_OFFER_PROMPT,
  NEW_CONNECTION,
  NEW_CONTENT,
} from '../utils/notifications/notificationTypes'
import {showDebugNotificationIfEnabled} from '../utils/notifications/showDebugNotificationIfEnabled'
import {showUINotificationFromRemoteMessage} from '../utils/notifications/showUINotificationFromRemoteMessage'
import reportError from '../utils/reportError'
import {fetchAndStoreMessagesForInboxAtom} from './chat/atoms/fetchNewMessagesActionAtom'
import {updateAllOffersConnectionsActionAtom} from './connections/atom/offerToConnectionsAtom'
import {getKeyHolderForFcmCypherActionAtom} from './notifications/fcmCypherToKeyHolderAtom'
import processChatNotificationActionAtom from './notifications/processChatNotification'

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

export function useHandleReceivedNotifications(): void {
  const navigation = useNavigation()
  const store = useStore()
  const fetchMessagesForInbox = useSetAtom(fetchAndStoreMessagesForInboxAtom)
  const updateOffersConnections = useSetAtom(
    updateAllOffersConnectionsActionAtom
  )

  useEffect(() => {
    return messaging().onMessage(async (remoteMessage) => {
      console.info('📳 Received notification', remoteMessage)
      await showDebugNotificationIfEnabled({
        title: 'Received notification in foreground',
        body: JSON.stringify(remoteMessage.data),
      })

      const data = (
        await store.set(
          decryptNotificationIfEncryptedActionAtom,
          remoteMessage.data
        )
      ).pipe(Option.getOrElse(() => remoteMessage.data))

      if (!data) {
        console.info(
          '📳 Nothing to process. Notification does not include any data'
        )
        return
      }

      const chatMessageNotificationOption =
        ChatNotificationData.parseUnkownOption(remoteMessage.data)
      if (Option.isSome(chatMessageNotificationOption)) {
        await store.set(
          processChatNotificationActionAtom,
          chatMessageNotificationOption.value,
          navigation.getState()
        )()
      }

      await showUINotificationFromRemoteMessage(remoteMessage)

      if (data.type === NEW_CONNECTION) {
        console.info(
          '📳 Received notification about new user. Checking and updating offers accordingly.'
        )
        await updateOffersConnections({isInBackground: false})()
        return
      }

      if (data.type === NEW_CONTENT) {
        console.info(
          'Received notification about new content. Doing nothing since this notification is meant to be displayed only if user is innactive.'
        )
        return
      }

      if (data.type === CREATE_OFFER_PROMPT) {
        void checkAndShowCreateOfferPrompt(store)
        return
      }

      reportError('warn', new Error('Unknown notification type'), {
        type: data.type,
      })
    })
  }, [fetchMessagesForInbox, navigation, store, updateOffersConnections])
}

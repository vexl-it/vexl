import {useEffect} from 'react'
import messaging from '@react-native-firebase/messaging'
import {useFetchAndStoreMessagesForInbox} from './chat/hooks/useFetchNewMessages'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as O from 'fp-ts/Option'
import {safeParse} from '../utils/fpUtils'
import reportError from '../utils/reportError'
import {showUINotificationFromRemoteMessage} from '../utils/notifications'
import {
  CHAT_NOTIFICATION_TYPES,
  NEW_CONNECTION,
} from '../utils/notifications/notificationTypes'
import {useSetAtom, useStore} from 'jotai'
import {updateAllOffersConnectionsActionAtom} from './connections/atom/offerToConnectionsAtom'
import {useNavigation} from '@react-navigation/native'
import {getChatIdOfChatOnCurrentScreenIfAny} from '../utils/navigation'
import focusChatWithMessagesAtom from './chat/atoms/focusChatWithMessagesAtom'
import {AppState} from 'react-native'

export function useHandleReceivedNotifications(): void {
  const fetchMessagesForInbox = useFetchAndStoreMessagesForInbox()
  const navigation = useNavigation()
  const store = useStore()
  const updateOffersConnections = useSetAtom(
    updateAllOffersConnectionsActionAtom
  )

  useEffect(() => {
    return messaging().onMessage(async (remoteMessage) => {
      console.info('📳 Received notification', remoteMessage)

      const data = remoteMessage.data
      if (!data) {
        console.info(
          '📳 Nothing to process. Notification does not include any data'
        )
        return
      }

      if (CHAT_NOTIFICATION_TYPES.includes(data.type)) {
        console.info('📳 Refreshing inbox')

        pipe(
          data.inbox,
          safeParse(PublicKeyPemBase64),
          O.fromEither,
          O.bindTo('inboxKey'),
          O.bind('sender', () =>
            O.fromEither(safeParse(PublicKeyPemBase64)(data.sender))
          ),
          O.bind('chatId', () =>
            getChatIdOfChatOnCurrentScreenIfAny(navigation.getState())
          ),
          O.bind('displayedChat', ({chatId, inboxKey}) =>
            O.fromNullable(
              store.get(focusChatWithMessagesAtom({chatId, inboxKey}))
            )
          ),
          O.match(
            () => {
              void showUINotificationFromRemoteMessage(remoteMessage)
            },
            ({chatId, inboxKey, displayedChat, sender}) => {
              if (
                AppState.currentState !== 'active' ||
                displayedChat.chat.otherSide.publicKey !== sender
              ) {
                void showUINotificationFromRemoteMessage(remoteMessage)
              }
            }
          )
        )

        void pipe(
          data.inbox,
          safeParse(PublicKeyPemBase64),
          TE.fromEither,
          TE.chainTaskK((inbox) => fetchMessagesForInbox(inbox)),
          TE.match(
            (e) => {
              reportError('error', 'Error processing messaging notification', e)
            },
            () => {
              console.info('📳 Inbox refreshed successfully')
            }
          )
        )()
        return
      }

      await showUINotificationFromRemoteMessage(remoteMessage)

      if (data.type === NEW_CONNECTION) {
        console.info(
          '📳 Received notification about new user. Checking and updating offers accordingly.'
        )
        await updateOffersConnections({isInBackground: false})()
        return
      }

      reportError('warn', 'Unknown notification type', data.type)
    })
  }, [fetchMessagesForInbox, navigation, store, updateOffersConnections])
}

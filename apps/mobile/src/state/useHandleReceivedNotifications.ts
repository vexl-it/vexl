import {useEffect} from 'react'
import messaging from '@react-native-firebase/messaging'
import {fetchAndStoreMessagesForInboxAtom} from './chat/atoms/fetchNewMessagesActionAtom'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as O from 'fp-ts/Option'
import {safeParse} from '../utils/fpUtils'
import reportError from '../utils/reportError'
import {showUINotificationFromRemoteMessage} from '../utils/notifications/showUINotificationFromRemoteMessage'
import {
  CHAT_NOTIFICATION_TYPES,
  NEW_CONNECTION,
  NEW_CONTENT,
} from '../utils/notifications/notificationTypes'
import {useSetAtom, useStore} from 'jotai'
import {updateAllOffersConnectionsActionAtom} from './connections/atom/offerToConnectionsAtom'
import {useNavigation} from '@react-navigation/native'
import {getChatIdOfChatOnCurrentScreenIfAny} from '../utils/navigation'
import focusChatWithMessagesAtom from './chat/atoms/focusChatWithMessagesAtom'
import {AppState} from 'react-native'
import {ChatNotificationData} from '../utils/notifications/ChatNotificationData'

function isChatDisplayedOnScreen({
  inboxKey,
  sender,
  navigationState,
  store,
}: {
  inboxKey: PublicKeyPemBase64
  sender: PublicKeyPemBase64
  navigationState: Parameters<typeof getChatIdOfChatOnCurrentScreenIfAny>['0']
  store: ReturnType<typeof useStore>
}): boolean {
  return pipe(
    getChatIdOfChatOnCurrentScreenIfAny(navigationState),
    O.bindTo('currentChatId'),
    O.bind('displayedChat', ({currentChatId}) =>
      O.fromNullable(
        store.get(focusChatWithMessagesAtom({chatId: currentChatId, inboxKey}))
      )
    ),
    O.match(
      () => false,
      ({displayedChat}) =>
        AppState.currentState === 'active' &&
        displayedChat.chat.otherSide.publicKey === sender &&
        displayedChat.chat.inbox.privateKey.publicKeyPemBase64 === inboxKey
    )
  )
}

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

      const data = remoteMessage.data
      if (!data) {
        console.info(
          '📳 Nothing to process. Notification does not include any data'
        )
        return
      }

      if ((CHAT_NOTIFICATION_TYPES as string[]).includes(data.type)) {
        console.info('📳 Refreshing inbox')

        pipe(
          data,
          safeParse(ChatNotificationData),
          O.fromEither,
          O.match(
            () => {
              // Do not display. Can not parse inbox key or sender
              reportError(
                'warn',
                'Received chat notification with invalid inbox key or sender key',
                {
                  data,
                }
              )
            },
            ({inbox, sender}) => {
              if (
                isChatDisplayedOnScreen({
                  inboxKey: inbox,
                  sender,
                  navigationState: navigation.getState(),
                  store,
                })
              )
                return

              void showUINotificationFromRemoteMessage(remoteMessage)
            }
          )
        )

        void pipe(
          data.inbox,
          safeParse(PublicKeyPemBase64),
          TE.fromEither,
          TE.chainTaskK((inbox) => fetchMessagesForInbox({key: inbox})),
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

      if (data.type === NEW_CONTENT) {
        console.info(
          'Received notification about new content. Doing nothing since this notification is meant to be displayed only if user is innactive.'
        )
        return
      }

      reportError('warn', 'Unknown notification type', data.type)
    })
  }, [fetchMessagesForInbox, navigation, store, updateOffersConnections])
}

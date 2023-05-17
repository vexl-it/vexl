import {useEffect} from 'react'
import messaging from '@react-native-firebase/messaging'
import {useFetchAndStoreMessagesForInbox} from './chat/hooks/useFetchNewMessages'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {safeParse} from '../utils/fpUtils'
import reportError from '../utils/reportError'
import {showUINotificationFromRemoteMessage} from '../utils/notifications'
import {
  CHAT_NOTIFICATION_TYPES,
  NEW_CONNECTION,
} from '../utils/notifications/notificationTypes'
import {useSetAtom} from 'jotai'
import {updateAllOffersConnectionsActionAtom} from './connections/atom/offerToConnectionsAtom'

export function useHandleReceivedNotifications(): void {
  const fetchMessagesForInbox = useFetchAndStoreMessagesForInbox()
  const updateOffersConnections = useSetAtom(
    updateAllOffersConnectionsActionAtom
  )

  useEffect(() => {
    return messaging().onMessage(async (remoteMessage) => {
      console.info('📳 Received notification', remoteMessage)
      await showUINotificationFromRemoteMessage(remoteMessage)

      const data = remoteMessage.data
      if (!data) {
        console.info(
          '📳 Nothing to process. Notification does not include any data'
        )
        return
      }

      if (CHAT_NOTIFICATION_TYPES.includes(data.type)) {
        console.info('📳 Refreshing inbox')
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

      if (data.type === NEW_CONNECTION) {
        console.info(
          '📳 Received notification about new user. Checking and updating offers accordingly.'
        )
        await updateOffersConnections()()
        return
      }

      reportError('warn', 'Unknown notification type', data.type)
    })
  }, [fetchMessagesForInbox, updateOffersConnections])
}

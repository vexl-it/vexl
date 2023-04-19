import {useEffect} from 'react'
import messaging from '@react-native-firebase/messaging'
import {useFetchAndStoreMessagesForInbox} from './chat/hooks/useFetchNewMessages'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {safeParse} from '../utils/fpUtils'
import reportError from '../utils/reportError'

const NOTIFICATION_TYPES = [
  'MESSAGE',
  'REQUEST_REVEAL',
  'APPROVE_REVEAL',
  'DISAPPROVE_REVEAL',
  'REQUEST_MESSAGING',
  'APPROVE_MESSAGING',
  'DISAPPROVE_MESSAGING',
  'DELETE_CHAT',
  'BLOCK_CHAT',
]

export function useHandleReceivedNotifications(): void {
  const fetchMessagesForInbox = useFetchAndStoreMessagesForInbox()

  useEffect(() => {
    return messaging().onMessage(async (remoteMessage) => {
      console.info('📳 Received notification', remoteMessage)

      const data = remoteMessage.data
      if (!data) {
        console.info(
          '. Nothing to process. 📳 Notification does not include any data'
        )
        return
      }

      if (NOTIFICATION_TYPES.includes(data.type)) {
        console.info('📳 refreshing inbox')
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

      reportError('warn', 'Unknown notification type', data.type)
    })
  }, [fetchMessagesForInbox])
}

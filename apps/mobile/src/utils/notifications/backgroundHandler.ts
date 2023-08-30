import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging'
import reportError from '../reportError'
import {getDefaultStore} from 'jotai'
import {updateAllOffersConnectionsActionAtom} from '../../state/connections/atom/offerToConnectionsAtom'
import {CHAT_NOTIFICATION_TYPES, NEW_CONNECTION} from './notificationTypes'
import {pipe} from 'fp-ts/function'
import {safeParse} from '../fpUtils'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import * as TE from 'fp-ts/TaskEither'
import {fetchAndStoreMessagesForInboxAtom} from '../../state/chat/atoms/fetchNewMessagesActionAtom'
import {showUINotificationFromRemoteMessage} from './showUINotificationFromRemoteMessage'
import notifee from '@notifee/react-native'
import {unreadChatsCountAtom} from '../../state/chat/atoms/unreadChatsCountAtom'

export async function processBackgroundMessage(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): Promise<void> {
  try {
    console.info('📳 Background notification received', remoteMessage)

    await showUINotificationFromRemoteMessage(remoteMessage)

    const data = remoteMessage.data
    if (!data) {
      console.info(
        '📳 Nothing to process. Notification does not include any data'
      )
      return
    }

    if ((CHAT_NOTIFICATION_TYPES as string[]).includes(data.type)) {
      console.info('📳 Refreshing inbox')

      void pipe(
        data.inbox,
        safeParse(PublicKeyPemBase64),
        TE.fromEither,
        TE.chainTaskK((inbox) =>
          getDefaultStore().set(fetchAndStoreMessagesForInboxAtom, {key: inbox})
        ),
        TE.match(
          (e) => {
            reportError('error', 'Error processing messaging notification', e)
          },
          () => {
            console.info('📳 Inbox refreshed successfully')

            notifee
              .setBadgeCount(getDefaultStore().get(unreadChatsCountAtom))
              .catch((e) => {
                reportError('warn', 'Unable to set badge count', e)
              })
          }
        )
      )()
      return
    }

    if (remoteMessage.data?.type === NEW_CONNECTION) {
      console.info(
        '📳 Received notification about new user. Checking and updating offers accordingly.'
      )
      await getDefaultStore().set(updateAllOffersConnectionsActionAtom, {
        isInBackground: true,
      })()
    }
  } catch (error) {
    reportError(
      'error',
      'Error while processing background notification',
      error
    )
  }
}

function setupBackgroundMessaging(): void {
  try {
    messaging().setBackgroundMessageHandler(processBackgroundMessage)
    console.log('📳 Registered background message handler')
  } catch (error) {
    reportError(
      'error',
      'Error while registering background message handler',
      error
    )
  }
}

setupBackgroundMessaging()

import notifee from '@notifee/react-native'
import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {getDefaultStore} from 'jotai'
import {fetchAndStoreMessagesForInboxAtom} from '../../state/chat/atoms/fetchNewMessagesActionAtom'
import {unreadChatsCountAtom} from '../../state/chat/atoms/unreadChatsCountAtom'
import {loadSession} from '../../state/session/loadSession'
import {safeParse} from '../fpUtils'
import reportError from '../reportError'
import isChatMessageNotification from './isChatMessageNotification'
import {showDebugNotificationIfEnabled} from './showDebugNotificationIfEnabled'
import {showUINotificationFromRemoteMessage} from './showUINotificationFromRemoteMessage'

export async function processBackgroundMessage(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): Promise<void> {
  try {
    console.info('📳 Background notification received', remoteMessage)
    await showUINotificationFromRemoteMessage(remoteMessage)

    void showDebugNotificationIfEnabled({
      title: `Background notification received`,
      body: `type: ${remoteMessage?.data?.type ?? '[empty]'}`,
    })

    const data = remoteMessage.data
    if (!data) {
      console.info(
        '📳 Nothing to process. Notification does not include any data'
      )
      return
    }

    if (isChatMessageNotification(remoteMessage)) {
      console.info('📳 Refreshing inbox')

      if (!(await loadSession())) {
        console.info('📳 No session in storage. Skipping refreshing inbox')
        return
      }

      void pipe(
        data.inbox,
        safeParse(PublicKeyPemBase64),
        TE.fromEither,
        TE.chainTaskK((inbox) =>
          getDefaultStore().set(fetchAndStoreMessagesForInboxAtom, {key: inbox})
        ),
        TE.match(
          (e) => {
            reportError(
              'error',
              new Error('Error processing messaging notification'),
              {e}
            )
          },
          () => {
            console.info('📳 Inbox refreshed successfully')

            notifee
              .setBadgeCount(getDefaultStore().get(unreadChatsCountAtom))
              .catch((e) => {
                reportError('warn', new Error('Unable to set badge count'), {e})
              })
          }
        )
      )()
    }
  } catch (error) {
    void showDebugNotificationIfEnabled({
      title: 'Error while processing notification on background',
      body: (error as Error).message ?? 'no message',
    })
    reportError(
      'error',
      new Error('Error while processing background notification'),
      {
        error,
      }
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
      new Error('Error while registering background message handler'),
      {
        error,
      }
    )
  }
}

setupBackgroundMessaging()

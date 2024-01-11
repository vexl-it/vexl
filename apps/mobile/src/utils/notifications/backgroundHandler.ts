import notifee from '@notifee/react-native'
import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {getDefaultStore} from 'jotai'
import {showDebugNotificationIfEnabled} from './showDebugNotificationIfEnabled'
import {fetchAndStoreMessagesForInboxAtom} from '../../state/chat/atoms/fetchNewMessagesActionAtom'
import {unreadChatsCountAtom} from '../../state/chat/atoms/unreadChatsCountAtom'
import {updateAllOffersConnectionsActionAtom} from '../../state/connections/atom/offerToConnectionsAtom'
import {safeParse} from '../fpUtils'
import reportError from '../reportError'
import checkForNewOffers from './checkForNewOffers'
import {
  CREATE_OFFER_PROMPT,
  NEW_CONNECTION,
  NEW_CONTENT,
} from './notificationTypes'
import {showUINotificationFromRemoteMessage} from './showUINotificationFromRemoteMessage'
import {loadSession} from '../../state/session'
import checkAndShowCreateOfferPrompt from './checkAndShowCreateOfferPrompt'
import isChatMessageNotification from './isChatMessageNotification'

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

      await loadSession()
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

    if (remoteMessage.data?.type === NEW_CONTENT) {
      console.info(
        '📳 Received notification about new content. Triggering check'
      )
      void showDebugNotificationIfEnabled({
        title: 'calling check for new coffers',
        body: 'ok',
      })
      void checkForNewOffers()
    }

    if (remoteMessage.data?.type === CREATE_OFFER_PROMPT) {
      void checkAndShowCreateOfferPrompt(getDefaultStore())
    }
  } catch (error) {
    void showDebugNotificationIfEnabled({
      title: 'Error while processing notification on background',
      body: (error as Error).message ?? 'no message',
    })
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

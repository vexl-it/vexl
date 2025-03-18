import {
  AdmitedToClubNetworkNotificationData,
  NewChatMessageNoticeNotificationData,
  NewClubConnectionNotificationData,
  NewSocialNetworkConnectionNotificationData,
} from '@vexl-next/domain/src/general/notifications'
import {Option, Schema} from 'effect'
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import {getDefaultStore} from 'jotai'
import {AppState, Platform} from 'react-native'
import {syncConnectionsActionAtom} from '../../state/connections/atom/connectionStateAtom'
import {updateAllOffersConnectionsActionAtom} from '../../state/connections/atom/offerToConnectionsAtom'
import processChatNotificationActionAtom from '../../state/notifications/processChatNotification'
import reportError from '../reportError'
import {extractDataPayloadFromNotification} from './extractDataFromNotification'
import {showDebugNotificationIfEnabled} from './showDebugNotificationIfEnabled'
import {showUINotificationFromRemoteMessage} from './showUINotificationFromRemoteMessage'

export async function processBackgroundMessage(
  unsafeData: unknown
): Promise<void> {
  try {
    const notificationPayloadO = extractDataPayloadFromNotification({
      source: 'background',
      data: unsafeData,
    })

    if (Option.isNone(notificationPayloadO)) {
      console.info(
        `📳 ‼️ Background notification and unable to parse ${JSON.stringify(
          unsafeData,
          null,
          2
        )}`
      )

      void showDebugNotificationIfEnabled({
        title: `Error decoding background notification `,
        subtitle: 'notifInBackgroundHandler',
        body: `${JSON.stringify(unsafeData, null, 2)}`,
      })
      return
    }

    const {payload, isHeadless} = notificationPayloadO.value

    if (Platform.OS === 'android' && AppState.currentState === 'active') {
      console.info(
        '📳 Received notification in backfground handler. App is active and we are on android. Leaving processing up to a hook'
      )
      void showDebugNotificationIfEnabled({
        title: `Received notification not processing in background`,
        subtitle: 'notifInBackgroundHandler',
        body: `App is active. Handling in hook`,
      })
      return
    }

    void showDebugNotificationIfEnabled({
      title: `Background notification received `,
      subtitle: 'notifInBackgroundHandler',
      body: `${JSON.stringify(payload, null, 2)}`,
    })

    console.info(
      `📳 Background notification received. Is headless: ${isHeadless}`,
      AppState.currentState,
      JSON.stringify(payload, null, 2)
    )

    const newChatMessageNoticeNotificationDataOption =
      NewChatMessageNoticeNotificationData.parseUnkownOption(payload)
    if (Option.isSome(newChatMessageNoticeNotificationDataOption)) {
      await getDefaultStore().set(
        processChatNotificationActionAtom,
        newChatMessageNoticeNotificationDataOption.value
      )()
      return
    }

    if (!payload) {
      console.info(
        '📳 Nothing to process. Notification does not include any data'
      )
      return
    }

    const isNewSocialNetworkConnectionNotification = Option.isSome(
      Schema.decodeUnknownOption(NewSocialNetworkConnectionNotificationData)(
        payload
      )
    )
    if (isNewSocialNetworkConnectionNotification) {
      await getDefaultStore().set(syncConnectionsActionAtom)()
      await getDefaultStore().set(updateAllOffersConnectionsActionAtom, {
        isInBackground: true,
      })()
      return
    }

    const newClubConnectionNotificationO = Schema.decodeUnknownOption(
      NewClubConnectionNotificationData
    )(payload)
    if (Option.isSome(newClubConnectionNotificationO)) {
      console.info(
        `🔔 Received notification about new user in club ${newClubConnectionNotificationO.value.clubUuids.join(',')}. Checking and updating offers accordingly.`
      )
      // TODO
      return
    }

    const admitedToClubNetworkNotificationDataO = Schema.decodeUnknownOption(
      AdmitedToClubNetworkNotificationData
    )(payload)
    if (Option.isSome(admitedToClubNetworkNotificationDataO)) {
      console.info(
        `🔔 Received notification about new user in club ${admitedToClubNetworkNotificationDataO.value.publicKey}`
      )
      // TODO
      return
    }

    await showUINotificationFromRemoteMessage(payload)
  } catch (error) {
    void showDebugNotificationIfEnabled({
      title: 'Error while processing notification on background',
      subtitle: 'notifInBackgroundHandler',
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

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK'

TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  ({data, error, executionInfo}) => {
    void processBackgroundMessage(data)
  }
)

async function setupBackgroundMessaging(): Promise<void> {
  try {
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
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

void setupBackgroundMessaging()

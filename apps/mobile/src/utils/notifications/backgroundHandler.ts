import notifee from '@notifee/react-native'
import {
  AdmitedToClubNetworkNotificationData,
  ClubDeactivatedNotificationData,
  NewChatMessageNoticeNotificationData,
  NewClubConnectionNotificationData,
  NewSocialNetworkConnectionNotificationData,
} from '@vexl-next/domain/src/general/notifications'
import {Effect, Option, Schema} from 'effect'
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import {getDefaultStore} from 'jotai'
import {AppState, Platform} from 'react-native'
import {checkForClubsAdmissionActionAtom} from '../../state/clubs/atom/checkForClubsAdmissionActionAtom'
import {
  syncAllClubsHandleStateWhenNotFoundActionAtom,
  syncSingleClubHandleStateWhenNotFoundActionAtom,
} from '../../state/clubs/atom/refreshClubsActionAtom'
import {
  addReasonToRemovedClubActionAtom,
  markRemovedClubAsNotifiedActionAtom,
} from '../../state/clubs/atom/removedClubsAtom'
import {syncConnectionsActionAtom} from '../../state/connections/atom/connectionStateAtom'
import {updateAndReencryptAllOffersConnectionsActionAtom} from '../../state/connections/atom/offerToConnectionsAtom'
import processChatNotificationActionAtom from '../../state/notifications/processChatNotification'
import {translationAtom} from '../localization/I18nProvider'
import reportError from '../reportError'
import {extractDataPayloadFromNotification} from './extractDataFromNotification'
import {getDefaultChannel} from './notificationChannels'
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
      console.info(
        '📳 Received notification about new user. Checking and updating offers accordingly.'
      )
      await Effect.runPromise(getDefaultStore().set(syncConnectionsActionAtom))
      await Effect.runPromise(
        getDefaultStore().set(
          updateAndReencryptAllOffersConnectionsActionAtom,
          {
            isInBackground: true,
          }
        )
      )
      return
    }

    const newClubConnectionNotificationO = Schema.decodeUnknownOption(
      NewClubConnectionNotificationData
    )(payload)
    if (Option.isSome(newClubConnectionNotificationO)) {
      console.info(
        `📳 Received notification about new user in club ${newClubConnectionNotificationO.value.clubUuids.join(',')}. Checking and updating offers accordingly.`
      )
      await Effect.runPromise(
        getDefaultStore().set(syncAllClubsHandleStateWhenNotFoundActionAtom, {
          updateOnlyUuids: newClubConnectionNotificationO.value.clubUuids,
        })
      )
      await Effect.runPromise(
        getDefaultStore().set(
          updateAndReencryptAllOffersConnectionsActionAtom,
          {
            isInBackground: true,
          }
        )
      )
      return
    }

    const admitedToClubNetworkNotificationDataO = Schema.decodeUnknownOption(
      AdmitedToClubNetworkNotificationData
    )(payload)
    if (Option.isSome(admitedToClubNetworkNotificationDataO)) {
      console.info(
        `📳 Received notification about beeing added to club ${admitedToClubNetworkNotificationDataO.value.publicKey}`
      )
      await Effect.runPromise(
        getDefaultStore().set(checkForClubsAdmissionActionAtom)
      )

      return
    }

    const ClubDeactivatedNotificationDataO = Schema.decodeUnknownOption(
      ClubDeactivatedNotificationData
    )(payload)
    if (Option.isSome(ClubDeactivatedNotificationDataO)) {
      const {t} = getDefaultStore().get(translationAtom)
      await Effect.runPromise(
        getDefaultStore().set(syncSingleClubHandleStateWhenNotFoundActionAtom, {
          clubUuid: ClubDeactivatedNotificationDataO.value.clubUuid,
        })
      )

      getDefaultStore().set(addReasonToRemovedClubActionAtom, {
        clubUuid: ClubDeactivatedNotificationDataO.value.clubUuid,
        reason: ClubDeactivatedNotificationDataO.value.reason,
      })

      console.info(
        `📳 Received notification about club deactivation ${ClubDeactivatedNotificationDataO.value.clubUuid}`
      )
      await notifee.displayNotification({
        title: t(
          `notifications.CLUB_DEACTIVATED.${ClubDeactivatedNotificationDataO.value.reason}.title`
        ),
        body: t(
          `notifications.CLUB_DEACTIVATED.${ClubDeactivatedNotificationDataO.value.reason}.body`
        ),
        android: {
          channelId: await getDefaultChannel(),
          pressAction: {
            id: 'default',
          },
        },
      })

      getDefaultStore().set(markRemovedClubAsNotifiedActionAtom, {
        clubUuid: ClubDeactivatedNotificationDataO.value.clubUuid,
      })

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

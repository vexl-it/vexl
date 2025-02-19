import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {Option} from 'effect'
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import {getDefaultStore} from 'jotai'
import {syncConnectionsActionAtom} from '../../state/connections/atom/connectionStateAtom'
import {updateAllOffersConnectionsActionAtom} from '../../state/connections/atom/offerToConnectionsAtom'
import processChatNotificationActionAtom from '../../state/notifications/processChatNotification'
import reportError from '../reportError'
import {NEW_CONNECTION} from './notificationTypes'
import {showDebugNotificationIfEnabled} from './showDebugNotificationIfEnabled'
import {showUINotificationFromRemoteMessage} from './showUINotificationFromRemoteMessage'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function processBackgroundMessage(data: unknown): Promise<void> {
  try {
    console.log('NOTIFICATION - background')
    if (!isRecord(data)) {
      void showDebugNotificationIfEnabled({
        title: `Background notification received`,
        body: `Data is not an object...`,
      })
      return
    }

    void showDebugNotificationIfEnabled({
      title: `Background notification received`,
      body: `type: ${typeof data?.type === 'string' ? data.type : data?.type === 'object' ? JSON.stringify(data.type) : '[empty]'}`,
    })
    console.info('📳 Background notification received', JSON.stringify(data))

    const newChatMessageNoticeNotificationDataOption =
      NewChatMessageNoticeNotificationData.parseUnkownOption(data)
    if (Option.isSome(newChatMessageNoticeNotificationDataOption)) {
      await getDefaultStore().set(
        processChatNotificationActionAtom,
        newChatMessageNoticeNotificationDataOption.value
      )()
      return
    }

    if (!data) {
      console.info(
        '📳 Nothing to process. Notification does not include any data'
      )
      return
    }

    if (data.type === NEW_CONNECTION) {
      await getDefaultStore().set(syncConnectionsActionAtom)()
      await getDefaultStore().set(updateAllOffersConnectionsActionAtom, {
        isInBackground: true,
      })()
      return
    }

    await showUINotificationFromRemoteMessage(data)
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

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK'

TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  ({data, error, executionInfo}) => {
    // TODO active? Prevent running twice
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

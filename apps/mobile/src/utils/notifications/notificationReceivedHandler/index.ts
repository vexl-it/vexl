import {Effect} from 'effect/index'
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import {loadSession} from '../../../state/session/loadSession'
import {reportErrorE} from '../../reportError'
import {ErrorLoadingSession, type AcceptedNotificationTypes} from './domain'
import {extractDataFromNotification} from './extractDataFromNotification'
import {handleAdmitedToClubNetworkNotification} from './handlers/admitedToClubNetwork'
import {handleClubDeactivatedNotification} from './handlers/clubDeactivated'
import {handleDebugDummyNotification} from './handlers/debugDummy'
import {handleNewChatMessageNoticeNotification} from './handlers/newChatMessageNotice'
import {handleNewClubConnectionNotification} from './handlers/newClubConnection'
import {handleNewSocialNetworkConnectionNotification} from './handlers/newSocialNetworkConnection'
import {handleUserInactivityNotification} from './handlers/userInactivity'
import {handleUserLoginOnDifferentDeviceNotification} from './handlers/userLoginOnDifferentDevice'
import {handleVexlProductNotification} from './handlers/vexlProductNotification'

const TASK = 'notification-background-task-v2'

// Notifications we present ourselves via displayLocalNotification arrive with a
// null (non-'push') trigger, whereas genuine remote pushes carry a 'push'
// trigger. The iOS foreground listener (willPresent) also fires for our own
// local notifications, so we use this to skip them and avoid reprocessing (and
// failing to decode) our own banners.
const isLocalNotification = (
  notification: Notifications.Notification
): boolean => {
  const trigger = notification.request.trigger
  return !(trigger != null && 'type' in trigger && trigger.type === 'push')
}

const notificationRequiresLoadedSession = (
  notificationData: AcceptedNotificationTypes
): boolean => {
  switch (notificationData._tag) {
    case 'NewChatMessageNoticeNotificationData':
    case 'NewSocialNetworkConnectionNotificationData':
    case 'NewClubConnectionNotificationData':
    case 'AdmitedToClubNetworkNotificationData':
    case 'ClubDeactivatedNotificationData':
      return true
    case 'UserLoginOnDifferentDeviceNotificationData':
    case 'UserInactivityNotificationData':
    case 'VexlProductNotificationData':
    case 'DebugDummyNotificationData':
      return false
  }
}

const processNotification = (
  input:
    | {
        source: 'listener'
        data: Notifications.Notification
      }
    | {
        source: 'backgroundTask'
        data: Notifications.NotificationTaskPayload
      }
): Promise<Notifications.BackgroundNotificationTaskResult> =>
  Effect.gen(function* (_) {
    if (input.source === 'listener' && isLocalNotification(input.data)) {
      yield* Effect.log('Ignoring locally-presented notification in listener')
      return Notifications.BackgroundNotificationTaskResult.NoData
    }

    const notificationData = yield* extractDataFromNotification(input)
    yield* Effect.log('Got notificaiton', input.source, notificationData)

    if (notificationRequiresLoadedSession(notificationData)) {
      const session = yield* loadSession()
      if (!session.sessionLoaded)
        return yield* Effect.fail(new ErrorLoadingSession())
    }

    if (notificationData._tag === 'NewChatMessageNoticeNotificationData') {
      yield* handleNewChatMessageNoticeNotification(notificationData)
    } else if (
      notificationData._tag === 'NewSocialNetworkConnectionNotificationData'
    ) {
      yield* handleNewSocialNetworkConnectionNotification(notificationData)
    } else if (notificationData._tag === 'NewClubConnectionNotificationData') {
      yield* handleNewClubConnectionNotification(notificationData)
    } else if (
      notificationData._tag === 'AdmitedToClubNetworkNotificationData'
    ) {
      yield* handleAdmitedToClubNetworkNotification(notificationData)
    } else if (notificationData._tag === 'ClubDeactivatedNotificationData') {
      yield* handleClubDeactivatedNotification(notificationData)
    } else if (
      notificationData._tag === 'UserLoginOnDifferentDeviceNotificationData'
    ) {
      yield* handleUserLoginOnDifferentDeviceNotification(notificationData)
    } else if (notificationData._tag === 'UserInactivityNotificationData') {
      yield* handleUserInactivityNotification(notificationData)
    } else if (notificationData._tag === 'VexlProductNotificationData') {
      yield* handleVexlProductNotification(notificationData)
    } else if (notificationData._tag === 'DebugDummyNotificationData') {
      yield* handleDebugDummyNotification(notificationData)
    }

    return Notifications.BackgroundNotificationTaskResult.NoData
  }).pipe(
    Effect.tapError((e) =>
      Effect.zip(
        Effect.logWarning('Error in notification handler', {input, cause: e}),
        reportErrorE(
          'error',
          new Error('Error processing notification', {cause: e}),
          {input, cause: e}
        )
      )
    ),
    Effect.tapDefect((e) =>
      Effect.zip(
        Effect.logWarning('Error in notification handler', {input, cause: e}),
        reportErrorE(
          'fatal',
          new Error('DEFECT processing notification', {cause: e}),
          {input, cause: e}
        )
      )
    ),
    Effect.catchAll(() =>
      Effect.succeed(Notifications.BackgroundNotificationTaskResult.Failed)
    ),
    Effect.runPromise
  )

//
//
//
// DEFINE LISTENERS AND TASKS
//
//
//
TaskManager.defineTask<Notifications.NotificationTaskPayload>(
  TASK,
  async ({data}) => {
    return await processNotification({source: 'backgroundTask', data})
  }
)

// LEt's disable it for now. We use socket to deliver notifications in foreground
// Only on iOS. On android we can rely on background handler
// if (Platform.OS === 'ios')
//   Notifications.addNotificationReceivedListener((data) => {
//     void processNotification({source: 'listener', data})
//   })

void Notifications.registerTaskAsync(TASK)

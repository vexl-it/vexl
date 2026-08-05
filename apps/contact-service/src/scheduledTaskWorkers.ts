import {makeRepeatingTaskLayer} from '@vexl-next/server-utils/src/repeatingTask'
import {Effect, Layer} from 'effect'
import {
  processNewContentNotificationCronConfig,
  processUserInactivityCronConfig,
} from './configs'
import {UserNotificationService} from './services/UserNotificationService'

const processUserInactivityLayer = makeRepeatingTaskLayer({
  queueName: 'contact-service-process-user-inactivity',
  jobName: 'process_user_inactivity',
  cronPattern: processUserInactivityCronConfig,
  lockResource: 'contactService:processUserInactivity',
  lockDuration: '30 minutes',
  task: Effect.flatMap(UserNotificationService, (userNotificationService) =>
    userNotificationService.notifyUsersAboutInactivity()
  ),
})

const processNewContentNotificationLayer = makeRepeatingTaskLayer({
  queueName: 'contact-service-process-new-content-notification',
  jobName: 'process_new_content_notification',
  cronPattern: processNewContentNotificationCronConfig,
  lockResource: 'contactService:processNewContentNotification',
  lockDuration: '30 minutes',
  task: Effect.flatMap(UserNotificationService, (userNotificationService) =>
    userNotificationService.notifyUsersAboutNewContent()
  ),
})

export const ScheduledTaskWorkersLayer = Layer.mergeAll(
  processUserInactivityLayer,
  processNewContentNotificationLayer
)

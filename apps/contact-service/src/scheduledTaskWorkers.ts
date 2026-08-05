import {makeRepeatingTaskLayer} from '@vexl-next/server-utils/src/repeatingTask'
import {Effect, Layer} from 'effect'
import {processUserInactivityCronConfig} from './configs'
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

export const ScheduledTaskWorkersLayer = Layer.mergeAll(
  processUserInactivityLayer
)

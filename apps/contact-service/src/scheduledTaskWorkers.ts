import {makeRepeatingTaskLayer} from '@vexl-next/server-utils/src/repeatingTask'
import {Effect, Layer} from 'effect'
import {
  deactivateAndClearClubsCronConfig,
  deleteInactiveClubMembersCronConfig,
  processNewContentNotificationCronConfig,
  processUserInactivityCronConfig,
} from './configs'
import {checkForInactiveUsers} from './internalServer/routes/checkForInactiveUsers'
import {deactivateAndClearClubs} from './internalServer/routes/deactivateAndClearClubs'
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

const deleteInactiveClubMembersLayer = makeRepeatingTaskLayer({
  queueName: 'contact-service-delete-inactive-club-members',
  jobName: 'delete_inactive_club_members',
  cronPattern: deleteInactiveClubMembersCronConfig,
  lockResource: 'contactService:deleteInactiveClubMembers',
  lockDuration: '30 minutes',
  task: checkForInactiveUsers,
})

const deactivateAndClearClubsLayer = makeRepeatingTaskLayer({
  queueName: 'contact-service-deactivate-and-clear-clubs',
  jobName: 'deactivate_and_clear_clubs',
  cronPattern: deactivateAndClearClubsCronConfig,
  lockResource: 'contactService:deactivateAndClearClubs',
  lockDuration: '30 minutes',
  task: deactivateAndClearClubs,
})

export const ScheduledTaskWorkersLayer = Layer.mergeAll(
  processUserInactivityLayer,
  processNewContentNotificationLayer,
  deleteInactiveClubMembersLayer,
  deactivateAndClearClubsLayer
)

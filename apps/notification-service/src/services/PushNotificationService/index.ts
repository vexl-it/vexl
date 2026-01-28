import {type VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  Array,
  Context,
  Data,
  Effect,
  identity,
  Layer,
  Match,
  Option,
  pipe,
} from 'effect'
import {type SupportedPushNotificationTask} from '../../domain'
import {NotificationMetricsService} from '../../metrics'
import {VexlNotificationTokenService} from '../VexlNotificationTokenService'
import {ExpoClientService} from './services/ExpoClientService'
import {type ExpoSdkError} from './services/ExpoClientService/utils'
import {
  generatePushNotificationsFromClubExpiredNoticeSendTask,
  generatePushNotificationsFromClubFlaggedNoticeSendTask,
  generatePushNotificationsFromNewChatMessageNoticeSendTask,
  generatePushNotificationsFromNewClubUserNoticeSendTask,
  generatePushNotificationsFromNewContentNoticeSendTask,
  generatePushNotificationsFromNewUserNoticeSendTask,
  generatePushNotificationsFromUserAdmittedToClubNoticeSendTask,
  generatePushNotificationsFromUserInactivityNoticeSendTask,
  generatePushNotificationsFromUserLoginOnDifferentDeviceNoticeSendTask,
} from './utils'

export class NoExpoTokenError extends Data.TaggedError('NoExpoTokenError')<{
  message: string
  vexlToken: VexlNotificationToken
}> {}

export interface PushNotificationServiceOperations {
  sendNotificationViaExpoNotification: (
    tasks: readonly SupportedPushNotificationTask[]
  ) => Effect.Effect<void, ExpoSdkError>
}

export class PushNotificationService extends Context.Tag(
  'PushNotificationService'
)<PushNotificationService, PushNotificationServiceOperations>() {
  static Live = Layer.effect(
    PushNotificationService,
    Effect.gen(function* (_) {
      const expoClient = yield* _(ExpoClientService)
      const notificationMetrics = yield* _(NotificationMetricsService)
      const vexlNotificationTokenService = yield* _(
        VexlNotificationTokenService
      )

      return {
        sendNotificationViaExpoNotification: (tasks) =>
          Effect.gen(function* (_) {
            const dataToSend = yield* _(
              Array.map(tasks, (task) =>
                Match.value(task).pipe(
                  Match.tag(
                    'NewChatMessageNoticeSendTask',
                    generatePushNotificationsFromNewChatMessageNoticeSendTask
                  ),
                  Match.tag(
                    'NewUserNoticeSendTask',
                    generatePushNotificationsFromNewUserNoticeSendTask
                  ),
                  Match.tag(
                    'NewClubUserNoticeSendTask',
                    generatePushNotificationsFromNewClubUserNoticeSendTask
                  ),
                  Match.tag(
                    'UserAdmittedToClubNoticeSendTask',
                    generatePushNotificationsFromUserAdmittedToClubNoticeSendTask
                  ),
                  Match.tag(
                    'UserInactivityNoticeSendTask',
                    generatePushNotificationsFromUserInactivityNoticeSendTask
                  ),
                  Match.tag(
                    'UserLoginOnDifferentDeviceNoticeSendTask',
                    generatePushNotificationsFromUserLoginOnDifferentDeviceNoticeSendTask
                  ),
                  Match.tag(
                    'ClubFlaggedNoticeSendTask',
                    generatePushNotificationsFromClubFlaggedNoticeSendTask
                  ),
                  Match.tag(
                    'ClubExpiredNoticeSendTask',
                    generatePushNotificationsFromClubExpiredNoticeSendTask
                  ),
                  Match.tag(
                    'NewContentNoticeSendTask',
                    generatePushNotificationsFromNewContentNoticeSendTask
                  ),
                  Match.exhaustive,
                  Effect.option
                )
              ),
              Effect.all,
              Effect.map(Array.filterMap(identity))
            )

            const notificationsToSend = pipe(
              dataToSend,
              Array.flatMap((d) =>
                Array.isArray(d.notificationToSend)
                  ? d.notificationToSend
                  : [d.notificationToSend]
              )
            )

            // TODO check if notifications were delivered successfully and deactivate tokens
            yield* _(expoClient.sendNotification(notificationsToSend))

            yield* _(
              Effect.forEach(dataToSend, (d) => {
                if (Option.isNone(d.metadata)) return Effect.void

                return notificationMetrics.reportNotificationSent({
                  id: d.trackingId,
                  clientPlatform: d.metadata.value.clientPlatform,
                  clientVersion: d.metadata.value.clientVersion,
                  systemNotificationSent:
                    Array.isArray(d.notificationToSend) &&
                    d.notificationToSend.length > 1,
                  sentAt: unixMillisecondsNow(),
                })
              })
            )
          }).pipe(
            Effect.provideService(
              VexlNotificationTokenService,
              vexlNotificationTokenService
            ),
            Effect.withSpan('sendingPushNotifications', {
              attributes: {tasks},
            })
          ),
      }
    })
  ).pipe(Layer.provide(ExpoClientService.Live))
}

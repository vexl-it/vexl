import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Context, Effect, identity, Layer, Match, pipe} from 'effect'
import {type SupportedPushNotificationTask} from '../../domain'
import {NotificationMetricsService} from '../../metrics'
import {NotificationTokensDb} from '../NotificationTokensDb'
import {
  ExpoClientService,
  type NotificationToSend,
} from './services/ExpoClientService'
import {type ExpoSdkError} from './services/ExpoClientService/utils'
import {
  generatePushNotificationFromVexlProductNotificationNoticeSendTask,
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

const notificationsToArray = (
  notificationToSend: NotificationToSend | readonly NotificationToSend[]
): readonly NotificationToSend[] =>
  'token' in notificationToSend ? [notificationToSend] : notificationToSend

const systemNotificationSent = (
  notificationToSend: NotificationToSend | readonly NotificationToSend[]
): boolean =>
  pipe(
    notificationsToArray(notificationToSend),
    Array.some(
      (notification: NotificationToSend) =>
        notification.title !== undefined && notification.body !== undefined
    )
  )

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
      const tokenDb = yield* _(NotificationTokensDb)

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
                  Match.tag(
                    'VexlProductNotificationSendTask',
                    generatePushNotificationFromVexlProductNotificationNoticeSendTask
                  ),
                  Match.exhaustive,
                  // Filter out notifications that do not meet the minimal client version requirement (if any)
                  Effect.filterOrFail(
                    (a) =>
                      !task.minimalClientVersion ||
                      a.metadata.clientVersion >= task.minimalClientVersion
                  ),
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

            if (Array.isEmptyArray(notificationsToSend)) {
              return
            }

            // TODO check if notifications were delivered successfully and deactivate tokens
            yield* _(expoClient.sendNotification(notificationsToSend))

            yield* _(
              Effect.forEach(dataToSend, (d) =>
                notificationMetrics.reportNotificationSent({
                  id: d.trackingId,
                  clientPlatform: d.metadata.clientPlatform,
                  clientVersion: d.metadata.clientVersion,
                  systemNotificationSent: systemNotificationSent(
                    d.notificationToSend
                  ),
                  sentAt: unixMillisecondsNow(),
                  channel: 'push',
                })
              )
            )
          }).pipe(
            Effect.provideService(NotificationTokensDb, tokenDb),
            Effect.withSpan('sendingPushNotifications')
          ),
      }
    })
  ).pipe(Layer.provide(ExpoClientService.Live))
}

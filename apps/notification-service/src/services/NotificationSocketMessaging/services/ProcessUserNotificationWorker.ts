import {createNotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {ProcessUserNotificationsConsumerLayer} from '@vexl-next/server-utils/src/UserNotificationMq'
import {Effect, Match} from 'effect/index'
import {NotificationSocketMessaging} from '..'
import {type SupportedPushNotificationTask} from '../../../domain'
import {findSecretForNotificationToken} from '../../NotificationTokensDb'
import {OfflineNotificationBuffer} from '../../OfflineNotificationBuffer'
import {ThrottledPushNotificationService} from '../../ThrottledPushNotificationService'
import {
  ClubExpiredNoticeSendTask,
  ClubFlaggedNoticeSendTask,
  NewClubUserNoticeSendTask,
  NewContentNoticeSendTask,
  NewUserNoticeSendTask,
  UserAdmittedToClubNoticeSendTask,
  UserInactivityNoticeSendTask,
  UserLoginOnDifferentDeviceNoticeSendTask,
  VexlProductNotificationSendTask,
} from '../domain'

const MINIMAL_CLIENT_VERSION_FOR_VEXL_PRODUCT_NOTIFICATION =
  VersionCode.make(740)

export const ProcessUserNotificationsWorker =
  ProcessUserNotificationsConsumerLayer((entry) =>
    Effect.gen(function* (_) {
      const socketMessaging = yield* _(NotificationSocketMessaging)
      const {issuePushNotification} = yield* _(ThrottledPushNotificationService)
      const offlineNotificationBuffer = yield* _(OfflineNotificationBuffer)
      const secret = yield* _(findSecretForNotificationToken(entry.token))

      const trackingId = createNotificationTrackingId()

      const task: SupportedPushNotificationTask = Match.value(entry).pipe(
        Match.tag(
          'NewUserNotificationMqEntry',
          () =>
            new NewUserNoticeSendTask({
              notificationToken: secret,
              trackingId,
            })
        ),
        Match.tag(
          'NewClubUserNotificationMqEntry',
          ({clubUuid}) =>
            new NewClubUserNoticeSendTask({
              notificationToken: secret,
              trackingId,
              clubUuid,
            })
        ),
        Match.tag(
          'UserAdmittedToClubNotificationMqEntry',
          ({publicKey}) =>
            new UserAdmittedToClubNoticeSendTask({
              notificationToken: secret,
              trackingId,
              publicKey,
            })
        ),
        Match.tag(
          'UserInactivityNotificationMqEntry',
          ({variant}) =>
            new UserInactivityNoticeSendTask({
              notificationToken: secret,
              trackingId,
              variant,
            })
        ),
        Match.tag(
          'UserLoginOnDifferentDeviceNotificationMqEntry',
          () =>
            new UserLoginOnDifferentDeviceNoticeSendTask({
              notificationToken: secret,
              trackingId,
            })
        ),
        Match.tag(
          'ClubFlaggedNotificationMqEntry',
          ({clubUuid}) =>
            new ClubFlaggedNoticeSendTask({
              notificationToken: secret,
              trackingId,
              clubUuid,
            })
        ),
        Match.tag(
          'ClubExpiredNotificationMqEntry',
          ({clubUuid}) =>
            new ClubExpiredNoticeSendTask({
              notificationToken: secret,
              trackingId,
              clubUuid,
            })
        ),
        Match.tag(
          'NewContentNotificationMqEntry',
          () =>
            new NewContentNoticeSendTask({
              notificationToken: secret,
              trackingId,
            })
        ),
        Match.tag(
          'VexlProductNotificationMqEntry',
          ({vexlProductNotification}) =>
            new VexlProductNotificationSendTask({
              notificationToken: secret,
              trackingId,
              vexlProductNotification,
              minimalClientVersion:
                MINIMAL_CLIENT_VERSION_FOR_VEXL_PRODUCT_NOTIFICATION,
            })
        ),
        Match.exhaustive
      )

      // Buffered before the socket attempt - a socket "delivery" only means
      // the message was enqueued for a possibly-dead connection. The entry is
      // removed when the client reports the notification as processed.
      yield* _(offlineNotificationBuffer.bufferTaskIfEnabled(task))

      yield* _(
        socketMessaging.sendNotice(task),
        Effect.catchAll((e) =>
          Effect.zipRight(
            Effect.logWarning(
              'Unable to send notification via socket, falling back to push notification',
              e
            ),
            issuePushNotification(task)
          )
        )
      )
    }).pipe(
      Effect.catchAll((e) =>
        Effect.logError('Failed to process user notification', e, {
          entryType: entry._tag,
        })
      )
    )
  )

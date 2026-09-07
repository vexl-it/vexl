import {createNotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {SendingNotificationError} from '@vexl-next/rest-api/src/services/notification/contract'
import {ProcessUserNotificationsConsumerLayer} from '@vexl-next/server-utils/src/UserNotificationMq'
import {Effect, Match, pipe} from 'effect'
import {NotificationSocketMessaging} from '..'
import {type SupportedPushNotificationTask} from '../../../domain'
import {OfflineNotificationBuffer} from '../../OfflineNotificationBuffer'
import {ThrottledPushNotificationService} from '../../ThrottledPushNotificationService'
import {VexlNotificationTokenService} from '../../VexlNotificationTokenService'
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
    Effect.gen(function* () {
      const socketMessaging = yield* NotificationSocketMessaging
      const tokenService = yield* VexlNotificationTokenService
      const {issuePushNotification} = yield* ThrottledPushNotificationService
      const offlineNotificationBuffer = yield* OfflineNotificationBuffer
      const vexlNotificationTokenOrExpoToken =
        entry.token ?? entry.notificationToken

      if (!vexlNotificationTokenOrExpoToken) {
        yield* Effect.logWarning(
          'No notification token found in the entry, skipping processing',
          {entryType: entry._tag}
        )

        return
      }

      const secret = yield* tokenService
        .normalizeToVexlNotificationTokenSecret(
          vexlNotificationTokenOrExpoToken
        )
        .pipe(
          Effect.catchTag(
            'NoSuchElementError',
            () => new SendingNotificationError({tokenInvalid: true})
          )
        )

      const trackingId = createNotificationTrackingId()

      const task: SupportedPushNotificationTask = Match.value(entry).pipe(
        Match.tag(
          'NewUserNotificationMqEntry',
          ({token}) =>
            new NewUserNoticeSendTask({
              notificationToken: secret,
              targetToken: token,
              trackingId,
            })
        ),
        Match.tag(
          'NewClubUserNotificationMqEntry',
          ({token, clubUuid}) =>
            new NewClubUserNoticeSendTask({
              notificationToken: secret,
              targetToken: token,
              trackingId,
              clubUuid,
            })
        ),
        Match.tag(
          'UserAdmittedToClubNotificationMqEntry',
          ({token, publicKey}) =>
            new UserAdmittedToClubNoticeSendTask({
              notificationToken: secret,
              targetToken: token,
              trackingId,
              publicKey,
            })
        ),
        Match.tag(
          'UserInactivityNotificationMqEntry',
          ({token, variant}) =>
            new UserInactivityNoticeSendTask({
              notificationToken: secret,
              targetToken: token,
              trackingId,
              variant,
            })
        ),
        Match.tag(
          'UserLoginOnDifferentDeviceNotificationMqEntry',
          ({token}) =>
            new UserLoginOnDifferentDeviceNoticeSendTask({
              notificationToken: secret,
              targetToken: token,
              trackingId,
            })
        ),
        Match.tag(
          'ClubFlaggedNotificationMqEntry',
          ({token, clubUuid}) =>
            new ClubFlaggedNoticeSendTask({
              notificationToken: secret,
              targetToken: token,
              trackingId,
              clubUuid,
            })
        ),
        Match.tag(
          'ClubExpiredNotificationMqEntry',
          ({token, clubUuid}) =>
            new ClubExpiredNoticeSendTask({
              notificationToken: secret,
              targetToken: token,
              trackingId,
              clubUuid,
            })
        ),
        Match.tag(
          'NewContentNotificationMqEntry',
          ({token}) =>
            new NewContentNoticeSendTask({
              notificationToken: secret,
              targetToken: token,
              trackingId,
            })
        ),
        Match.tag(
          'VexlProductNotificationMqEntry',
          ({token, vexlProductNotification}) =>
            new VexlProductNotificationSendTask({
              notificationToken: secret,
              targetToken: token,
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
      yield* offlineNotificationBuffer.bufferTaskIfEnabled(task)

      yield* pipe(
        socketMessaging.sendNotice(task),
        Effect.catch((e) =>
          Effect.andThen(
            Effect.logWarning(
              'Unable to send notification via socket, falling back to push notification',
              e
            ),
            issuePushNotification(task)
          )
        )
      )
    }).pipe(
      Effect.catch((e) =>
        Effect.logError('Failed to process user notification', e, {
          entryType: entry._tag,
        })
      )
    )
  )

import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {createNotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {SendingNotificationError} from '@vexl-next/rest-api/src/services/notification/contract'
import {ProcessUserNotificationsConsumerLayer} from '@vexl-next/server-utils/src/UserNotificationMq'
import {Effect, Match} from 'effect/index'
import {NotificationSocketMessaging} from '..'
import {type SupportedPushNotificationTask} from '../../../domain'
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
    Effect.gen(function* (_) {
      const socketMessaging = yield* _(NotificationSocketMessaging)
      const tokenService = yield* _(VexlNotificationTokenService)
      const {issuePushNotification} = yield* _(ThrottledPushNotificationService)
      const vexlNotificationTokenOrExpoToken =
        entry.token ?? entry.notificationToken

      if (!vexlNotificationTokenOrExpoToken) {
        yield* Effect.logWarning(
          'No notification token found in the entry, skipping processing',
          entry
        )

        return
      }

      const secret = yield* _(
        tokenService.normalizeToVexlNotificationTokenSecret(
          vexlNotificationTokenOrExpoToken
        )
      ).pipe(
        Effect.catchTag(
          'NoSuchElementException',
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
          ({token}) =>
            new UserInactivityNoticeSendTask({
              notificationToken: secret,
              targetToken: token,
              trackingId,
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
        Effect.zipRight(
          Effect.logError('Failed to process user notification', e, entry),
          new UnexpectedServerError({
            message: 'Failed to issue push notification',
            cause: e,
          })
        )
      ),
      Effect.ignore
    )
  )

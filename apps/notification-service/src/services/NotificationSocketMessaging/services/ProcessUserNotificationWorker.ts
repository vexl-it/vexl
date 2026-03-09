import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {createNotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
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
} from '../domain'

export const ProcessUserNotificationsWorker =
  ProcessUserNotificationsConsumerLayer((entry) =>
    Effect.gen(function* (_) {
      yield* _(
        Effect.log(
          'Notification Debug',
          `Processing user notification entry: ${JSON.stringify(entry)}`
        )
      )

      const socketMessaging = yield* _(NotificationSocketMessaging)
      const tokenService = yield* _(VexlNotificationTokenService)
      const {issuePushNotification} = yield* _(ThrottledPushNotificationService)
      const vexlNotificationTokenOrExpoToken =
        entry.token ?? entry.notificationToken

      yield* _(
        Effect.log(
          `Notification Debug: Resolved token: ${JSON.stringify(vexlNotificationTokenOrExpoToken)}`
        )
      )

      if (!vexlNotificationTokenOrExpoToken) {
        yield* Effect.logWarning(
          'Notification Debug: No notification token found in the entry, skipping processing',
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

      yield* _(
        Effect.log(
          `Notification Debug: Normalized token secret successfully, creating task for entry tag: ${entry._tag}`
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
        Match.exhaustive
      )

      yield* _(
        Effect.log(
          `Notification Debug: Sending notice via socket: ${JSON.stringify(task)}`
        )
      )

      yield* _(
        socketMessaging.sendNotice(task),
        Effect.tap(() =>
          Effect.log(
            `Notification Debug: Successfully sent notification via socket for task: ${JSON.stringify(task)}`
          )
        ),
        Effect.catchAll((e) =>
          Effect.zipRight(
            Effect.logWarning(
              'Notification Debug: Unable to send notification via socket, falling back to push notification',
              e
            ),
            Effect.gen(function* (_) {
              yield* _(
                Effect.log(
                  `Notification Debug: Starting push notification fallback for task: ${JSON.stringify(task)}`
                )
              )
              yield* _(issuePushNotification(task))
              yield* _(
                Effect.log(
                  `Notification Debug: Successfully sent push notification fallback for task: ${JSON.stringify(task)}`
                )
              )
            })
          )
        )
      )
    }).pipe(
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Notification Debug: Failed to process user notification',
            e,
            entry
          ),
          new UnexpectedServerError({
            message: 'Failed to issue push notification',
            cause: e,
          })
        )
      ),
      // TODO:
      Effect.ignore
    )
  )

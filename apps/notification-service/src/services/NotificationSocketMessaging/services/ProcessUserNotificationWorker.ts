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
      const socketMessaging = yield* _(NotificationSocketMessaging)
      const tokenService = yield* _(VexlNotificationTokenService)
      const {issuePushNotification} = yield* _(ThrottledPushNotificationService)
      const vexlNotificationTokenOrExpoToken =
        entry.token ?? entry.notificationToken

      if (!vexlNotificationTokenOrExpoToken)
        return yield* _(new SendingNotificationError({tokenInvalid: true}))

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
            issuePushNotification(task).pipe(
              Effect.catchAll(
                (e) =>
                  new UnexpectedServerError({
                    message: 'Failed to issue push notification',
                    cause: e,
                  })
              )
            )
          )
        )
      )
    }).pipe(
      Effect.catchTag('SendingNotificationError', (e) =>
        Effect.logWarning('Skipping notification due to invalid token', e).pipe(
          Effect.annotateLogs({entry: JSON.stringify(entry)})
        )
      )
    )
  )

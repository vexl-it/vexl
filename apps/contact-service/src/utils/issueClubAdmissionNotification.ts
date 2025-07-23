import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {AdmitedToClubNetworkNotificationData} from '@vexl-next/domain/src/general/notifications'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {Effect, Option} from 'effect'
import {ExpoNotificationsService} from './expoNotifications/ExpoNotificationsService'

export const issueClubAdmissionNotification = ({
  admittedMemberPublickey,
  notificationToken,
}: {
  admittedMemberPublickey: PublicKeyPemBase64
  notificationToken: ExpoNotificationToken
}): Effect.Effect<void, never, ExpoNotificationsService> =>
  Effect.gen(function* (_) {
    const notificationService = yield* _(ExpoNotificationsService)
    yield* _(
      notificationService.sendNotifications([
        {
          to: [notificationToken],
          data: new AdmitedToClubNetworkNotificationData({
            trackingId: Option.none(),
            publicKey: admittedMemberPublickey,
          }).toData(),
        },
      ])
    )
  }).pipe(
    Effect.withSpan('Issue club admission notification'),
    Effect.forkDaemon,
    Effect.ignore
  )

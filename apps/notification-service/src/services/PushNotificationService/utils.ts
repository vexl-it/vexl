import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {type NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {
  isVexlNotificationToken,
  type VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {
  createNotificationTrackingId,
  type NotificationTrackingId,
} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import * as translations from '@vexl-next/localization/src/translations'
import {type PlatformName} from '@vexl-next/rest-api'
import {type InvalidFcmCypherError} from '@vexl-next/rest-api/src/services/notification/contract'
import {type Array, Data, Effect, Option, Schema} from 'effect'
import {type NewChatMessageNoticeSendTask} from '../NotificationSocketMessaging/domain'
import {VexlNotificationTokenService} from '../VexlNotificationTokenService'
import {type NotificationToSend} from './services/ExpoClientService'

export class NoExpoTokenError extends Data.TaggedError('NoExpoTokenError')<{
  message: string
  vexlToken: VexlNotificationTokenSecret
}> {}

export function getNotificationContentByLocale(locale: string): {
  title: string
  body: string
} {
  try {
    const lang: any =
      // @ts-expect-error this is fine
      translations[locale] ?? translations.en

    if (
      !lang.messages.fallbackMessage.body ||
      !lang.messages.fallbackMessage.title
    )
      throw new Error('Missing fallback message')
    return {
      title: lang.messages.fallbackMessage.title,
      body: lang.messages.fallbackMessage.body,
    }
  } catch (e) {
    const fallback: any = translations.dev
    return {
      title: fallback.messages.fallbackMessage.title,
      body: fallback.messages.fallbackMessage.body,
    }
  }
}

export const generatePushNotificationsFromNewChatMessageNoticeSendTask = (
  task: NewChatMessageNoticeSendTask
): Effect.Effect<
  {
    notificationToSend: Array.NonEmptyArray<NotificationToSend>
    trackingId: NotificationTrackingId
    metadata: {
      locale: string
      clientVersion: VersionCode
      clientPlatform: PlatformName
    }
  },
  NoExpoTokenError | InvalidFcmCypherError,
  VexlNotificationTokenService
> =>
  Effect.gen(function* (_) {
    const vexlNotificationTokenService = yield* _(VexlNotificationTokenService)

    const token = yield* _(
      vexlNotificationTokenService.getExpoToken(task.notificationToken),
      Effect.catchAll(
        () =>
          new NoExpoTokenError({
            message: 'No Expo token for given Vexl notification token',
            vexlToken: task.notificationToken,
          })
      )
    )

    yield* _(Effect.logInfo('Sending notification'))

    // eventually we need to handle more task types

    const targetCypher = task.targetCypher

    const metadata = yield* _(
      vexlNotificationTokenService.getMetadata(
        task.targetCypher ?? task.notificationToken
      ),
      Effect.catchAll(
        () =>
          new NoExpoTokenError({
            message: 'Unable to find metadata for the token',
            vexlToken: task.notificationToken,
          })
      )
    )

    const trackingId = createNotificationTrackingId()

    const sendSystemNotification = task.sendNewChatMessageNotification
    const systemNotification: NotificationToSend = {
      token,
      ...getNotificationContentByLocale(metadata.locale),
      data: Schema.encodeSync(NewChatMessageNoticeNotificationData)(
        new NewChatMessageNoticeNotificationData({
          trackingId: Option.some(trackingId),
          sentAt: unixMillisecondsNow(),
          targetCypher:
            task.targetCypher && isVexlNotificationToken(task.targetCypher)
              ? undefined
              : // Backward compatibility - it's checked at the top
                (task.targetCypher as NotificationCypher),
          targetToken: task.targetToken,
          includesSystemNotification: true,
          systemNotificationSent: Option.some(sendSystemNotification),
        })
      ),
    }

    const backgroundNotification: NotificationToSend = {
      token,
      data: Schema.encodeSync(NewChatMessageNoticeNotificationData)(
        new NewChatMessageNoticeNotificationData({
          trackingId: Option.some(trackingId),
          sentAt: unixMillisecondsNow(),
          targetCypher:
            // TODO remove #2124
            !!targetCypher && !isVexlNotificationToken(targetCypher)
              ? targetCypher
              : undefined,
          targetToken: task.targetToken,
          includesSystemNotification: false,
          systemNotificationSent: Option.some(sendSystemNotification),
        })
      ),
    }

    const notificationToSend: Array.NonEmptyArray<NotificationToSend> = [
      backgroundNotification,
      ...(sendSystemNotification ? [systemNotification] : []),
    ]

    return {notificationToSend, trackingId, metadata}
  })

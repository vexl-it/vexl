import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {
  createNotificationTrackingId,
  type NotificationTrackingId,
} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import * as translations from '@vexl-next/localization/src/translations'
import {
  type ExpoV2CypherPayload,
  extractPartsOfNotificationCypher,
} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {InvalidFcmCypherError} from '@vexl-next/rest-api/src/services/notification/contract'
import {type Array, Data, Effect, Option, Schema} from 'effect'
import {
  type NewChatMessageNoticeSendTask,
  type VexlNotificationToken,
  vexlNotificationTokenToExpoToken,
} from '../NotificationSocketMessaging/domain'
import {type NotificationToSend} from './services/ExpoClientService'

export class NoExpoTokenError extends Data.TaggedError('NoExpoTokenError')<{
  message: string
  vexlToken: VexlNotificationToken
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
    metadata: ExpoV2CypherPayload
  },
  NoExpoTokenError | InvalidFcmCypherError
> =>
  Effect.gen(function* (_) {
    const token = yield* _(
      vexlNotificationTokenToExpoToken(task.notificationToken),
      Effect.catchTag(
        'NoSuchElementException',
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

    const {data: metadata} = yield* _(
      extractPartsOfNotificationCypher({
        notificationCypher: targetCypher,
      }),
      Effect.catchTag(
        'NoSuchElementException',
        () => new InvalidFcmCypherError()
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
          targetCypher,
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
          targetCypher,
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

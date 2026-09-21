import {
  AdmitedToClubNetworkNotificationData,
  ClubDeactivatedNotificationData,
  NewChatMessageNoticeNotificationData,
  NewClubConnectionNotificationData,
  NewContentNotificationData,
  NewSocialNetworkConnectionNotificationData,
  UserInactivityNotificationData,
  UserLoginOnDifferentDeviceNotificationData,
  VexlProductNotificationData,
} from '@vexl-next/domain/src/general/notifications'
import {type VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {
  createNotificationTrackingId,
  type NotificationTrackingId,
} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  appLocaleCatalogs,
  type AppLocale,
} from '@vexl-next/localization/src/translations'
import {type PlatformName} from '@vexl-next/rest-api'
import {Data, Effect, Option, Schema} from 'effect'
import {type ExpoPushToken} from 'expo-server-sdk'
import type {
  ClubExpiredNoticeSendTask,
  ClubFlaggedNoticeSendTask,
  NewChatMessageNoticeSendTask,
  NewClubUserNoticeSendTask,
  NewContentNoticeSendTask,
  NewUserNoticeSendTask,
  UserAdmittedToClubNoticeSendTask,
  UserInactivityNoticeSendTask,
  UserLoginOnDifferentDeviceNoticeSendTask,
  VexlProductNotificationSendTask,
} from '../NotificationSocketMessaging/domain'
import {NotificationTokensDb} from '../NotificationTokensDb'
import {type NotificationToSend} from './services/ExpoClientService'

export class NoExpoTokenError extends Data.TaggedError('NoExpoTokenError')<{
  message: string
  vexlToken: VexlNotificationTokenSecret
}> {}

interface Metadata {
  locale: string
  clientVersion: VersionCode
  clientPlatform: PlatformName
}

interface PushNotificationGeneratorResult {
  notificationToSend: NotificationToSend | NotificationToSend[]
  trackingId: NotificationTrackingId
  metadata: Metadata
}

const resolveTokenAndMetadata = (
  secret: VexlNotificationTokenSecret
): Effect.Effect<
  {
    token: ExpoPushToken
    metadata: Metadata
  },
  NoExpoTokenError,
  NotificationTokensDb
> =>
  Effect.gen(function* (_) {
    const tokenDb = yield* _(NotificationTokensDb)
    const record = yield* _(
      tokenDb.findSecretBySecretValue(secret),
      Effect.flatten
    )
    const token = yield* _(Effect.fromNullable(record.expoNotificationToken))

    return {
      token,
      metadata: {
        locale: record.clientLanguage,
        clientVersion: record.clientVersion,
        clientPlatform: record.clientPlatform,
      },
    }
  }).pipe(
    Effect.catchAll(
      () =>
        new NoExpoTokenError({
          message: 'No Expo token for given Vexl notification token',
          vexlToken: secret,
        })
    )
  )

export function getNotificationContentByLocale(locale: string): {
  title: string
  body: string
} {
  const catalog = isAppLocale(locale)
    ? appLocaleCatalogs[locale]
    : appLocaleCatalogs.en

  return {
    title: catalog['messages.fallbackMessage.title'],
    body: catalog['messages.fallbackMessage.body'],
  }
}

function isAppLocale(locale: string): locale is AppLocale {
  return locale in appLocaleCatalogs
}

export const generatePushNotificationsFromNewChatMessageNoticeSendTask = (
  task: NewChatMessageNoticeSendTask
): Effect.Effect<
  PushNotificationGeneratorResult,
  NoExpoTokenError,
  NotificationTokensDb
> =>
  Effect.gen(function* (_) {
    const {token, metadata} = yield* _(
      resolveTokenAndMetadata(task.notificationToken)
    )

    yield* _(Effect.logInfo('Sending notification'))

    const trackingId = createNotificationTrackingId()

    // We are sending system notifications only for iOS devices.
    // On Android we can rely on background notifications.
    const sendSystemNotification = task.sendNewChatMessageNotification

    const notificationData = (
      includesSystemNotification: boolean
    ): Record<string, string> =>
      Schema.encodeSync(NewChatMessageNoticeNotificationData)(
        new NewChatMessageNoticeNotificationData({
          trackingId: Option.some(trackingId),
          sentAt: unixMillisecondsNow(),
          targetToken: task.targetToken,
          includesSystemNotification,
          systemNotificationSent: Option.some(sendSystemNotification),
        })
      )

    const systemNotification: NotificationToSend = {
      token,
      ...getNotificationContentByLocale(metadata.locale),
      data: notificationData(true),
    }

    const backgroundNotification: NotificationToSend = {
      token,
      data: notificationData(false),
    }

    const notificationToSend = [
      // on iOS we send just the system notification.
      ...(metadata.clientPlatform !== 'IOS' ? [backgroundNotification] : []),
      // In case of ios we don't send any notification if sendSystemNotification is false. That is ok
      ...(sendSystemNotification && metadata.clientPlatform === 'IOS'
        ? [systemNotification]
        : []),
    ]

    return {notificationToSend, trackingId, metadata}
  })

export const generatePushNotificationsFromNewUserNoticeSendTask = (
  task: NewUserNoticeSendTask
): Effect.Effect<
  PushNotificationGeneratorResult,
  NoExpoTokenError,
  NotificationTokensDb
> =>
  Effect.gen(function* (_) {
    const {token, metadata} = yield* _(
      resolveTokenAndMetadata(task.notificationToken)
    )
    const trackingId = task.trackingId ?? createNotificationTrackingId()

    const notification: NotificationToSend = {
      token,
      data: new NewSocialNetworkConnectionNotificationData({
        type: 'NEW_APP_USER',
        trackingId: Option.some(trackingId),
        sentAt: unixMillisecondsNow(),
      }).toData(),
    }

    return {
      notificationToSend: notification,
      trackingId,
      metadata,
    }
  })

export const generatePushNotificationsFromNewClubUserNoticeSendTask = (
  task: NewClubUserNoticeSendTask
): Effect.Effect<
  PushNotificationGeneratorResult,
  NoExpoTokenError,
  NotificationTokensDb
> =>
  Effect.gen(function* (_) {
    const {token, metadata} = yield* _(
      resolveTokenAndMetadata(task.notificationToken)
    )
    const trackingId = task.trackingId ?? createNotificationTrackingId()

    const notification: NotificationToSend = {
      token,
      data: new NewClubConnectionNotificationData({
        clubUuids: [task.clubUuid],
        trackingId: Option.some(trackingId),
      }).toData(),
    }

    return {notificationToSend: [notification], trackingId, metadata}
  })

export const generatePushNotificationsFromUserAdmittedToClubNoticeSendTask = (
  task: UserAdmittedToClubNoticeSendTask
): Effect.Effect<
  PushNotificationGeneratorResult,
  NoExpoTokenError,
  NotificationTokensDb
> =>
  Effect.gen(function* (_) {
    const {token, metadata} = yield* _(
      resolveTokenAndMetadata(task.notificationToken)
    )
    const trackingId = task.trackingId ?? createNotificationTrackingId()

    const notification: NotificationToSend = {
      token,
      data: new AdmitedToClubNetworkNotificationData({
        publicKey: task.publicKey,
        trackingId: Option.some(trackingId),
      }).toData(),
    }

    return {notificationToSend: [notification], trackingId, metadata}
  })

export const generatePushNotificationsFromUserInactivityNoticeSendTask = (
  task: UserInactivityNoticeSendTask
): Effect.Effect<
  PushNotificationGeneratorResult,
  NoExpoTokenError,
  NotificationTokensDb
> =>
  Effect.gen(function* (_) {
    const {token, metadata} = yield* _(
      resolveTokenAndMetadata(task.notificationToken)
    )
    const trackingId = task.trackingId ?? createNotificationTrackingId()

    const notification: NotificationToSend = {
      token,
      data: new UserInactivityNotificationData({
        trackingId: Option.some(trackingId),
        variant: task.variant,
      }).toData(),
    }

    return {notificationToSend: [notification], trackingId, metadata}
  })

export const generatePushNotificationsFromUserLoginOnDifferentDeviceNoticeSendTask =
  (
    task: UserLoginOnDifferentDeviceNoticeSendTask
  ): Effect.Effect<
    PushNotificationGeneratorResult,
    NoExpoTokenError,
    NotificationTokensDb
  > =>
    Effect.gen(function* (_) {
      const {token, metadata} = yield* _(
        resolveTokenAndMetadata(task.notificationToken)
      )
      const trackingId = task.trackingId ?? createNotificationTrackingId()

      const notification: NotificationToSend = {
        token,
        data: new UserLoginOnDifferentDeviceNotificationData({
          trackingId: Option.some(trackingId),
        }).toData(),
      }

      return {notificationToSend: [notification], trackingId, metadata}
    })

export const generatePushNotificationsFromClubFlaggedNoticeSendTask = (
  task: ClubFlaggedNoticeSendTask
): Effect.Effect<
  PushNotificationGeneratorResult,
  NoExpoTokenError,
  NotificationTokensDb
> =>
  Effect.gen(function* (_) {
    const {token, metadata} = yield* _(
      resolveTokenAndMetadata(task.notificationToken)
    )
    const trackingId = task.trackingId ?? createNotificationTrackingId()

    const notification: NotificationToSend = {
      token,
      data: new ClubDeactivatedNotificationData({
        clubUuid: task.clubUuid,
        reason: 'FLAGGED',
        trackingId: Option.some(trackingId),
      }).toData(),
    }

    return {notificationToSend: [notification], trackingId, metadata}
  })

export const generatePushNotificationsFromClubExpiredNoticeSendTask = (
  task: ClubExpiredNoticeSendTask
): Effect.Effect<
  PushNotificationGeneratorResult,
  NoExpoTokenError,
  NotificationTokensDb
> =>
  Effect.gen(function* (_) {
    const {token, metadata} = yield* _(
      resolveTokenAndMetadata(task.notificationToken)
    )
    const trackingId = task.trackingId ?? createNotificationTrackingId()

    const notification: NotificationToSend = {
      token,
      data: new ClubDeactivatedNotificationData({
        clubUuid: task.clubUuid,
        reason: 'EXPIRED',
        trackingId: Option.some(trackingId),
      }).toData(),
    }

    return {notificationToSend: [notification], trackingId, metadata}
  })

export const generatePushNotificationsFromNewContentNoticeSendTask = (
  task: NewContentNoticeSendTask
): Effect.Effect<
  PushNotificationGeneratorResult,
  NoExpoTokenError,
  NotificationTokensDb
> =>
  Effect.gen(function* (_) {
    const {token, metadata} = yield* _(
      resolveTokenAndMetadata(task.notificationToken)
    )
    const trackingId = task.trackingId ?? createNotificationTrackingId()

    const notification: NotificationToSend = {
      token,
      data: new NewContentNotificationData({
        trackingId: Option.some(trackingId),
      }).toData(),
    }

    return {notificationToSend: [notification], trackingId, metadata}
  })

export const generatePushNotificationFromVexlProductNotificationNoticeSendTask =
  (
    task: VexlProductNotificationSendTask
  ): Effect.Effect<
    PushNotificationGeneratorResult,
    NoExpoTokenError,
    NotificationTokensDb
  > =>
    Effect.gen(function* (_) {
      const {token, metadata} = yield* _(
        resolveTokenAndMetadata(task.notificationToken)
      )
      const trackingId = task.trackingId ?? createNotificationTrackingId()

      const notification: NotificationToSend = {
        token,
        title: task.vexlProductNotification.title,
        body: task.vexlProductNotification.description,
        data: new VexlProductNotificationData({
          trackingId: Option.some(trackingId),
          ...task.vexlProductNotification,
        }).toData(),
      }

      return {notificationToSend: [notification], trackingId, metadata}
    })

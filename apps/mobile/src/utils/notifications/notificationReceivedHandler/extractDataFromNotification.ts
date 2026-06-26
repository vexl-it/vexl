import {Effect, Schema} from 'effect/index'
import {isRecord} from 'effect/Predicate'
import type {Notification, NotificationTaskPayload} from 'expo-notifications'
import {AcceptedNotificationTypes, ErrorParsingNotification} from './domain'

const IOS_REMOTE_NOTIFICATION_LAUNCH_OPTIONS_KEY =
  'UIApplicationLaunchOptionsRemoteNotificationKey'

function parseDataString(
  dataString: string
): Record<string, unknown> | undefined {
  try {
    const data: unknown = JSON.parse(dataString)

    if (isRecord(data)) return data

    return undefined
  } catch {
    return undefined
  }
}

function dataStringOrNotificationData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const {dataString, ...notificationData} = data

  return typeof dataString === 'string'
    ? (parseDataString(dataString) ?? notificationData)
    : notificationData
}

function extractBackgroundTaskData(
  data: NotificationTaskPayload
): Record<string, unknown> {
  if ('actionIdentifier' in data) {
    return data.notification.request.content.data ?? {}
  }

  const remoteNotification =
    data.data[IOS_REMOTE_NOTIFICATION_LAUNCH_OPTIONS_KEY]

  if (isRecord(remoteNotification) && isRecord(remoteNotification.body)) {
    return dataStringOrNotificationData(remoteNotification.body)
  }

  return dataStringOrNotificationData(data.data)
}

export function extractDataFromNotification({
  source,
  data,
}:
  | {
      source: 'backgroundTask'
      data: NotificationTaskPayload
    }
  | {
      source: 'listener'
      data: Notification
    }): Effect.Effect<AcceptedNotificationTypes, ErrorParsingNotification> {
  return Effect.try({
    try: () => {
      if (source === 'listener') {
        return data.request.content.data ?? {}
      }

      return extractBackgroundTaskData(data)
    },
    catch: (e) =>
      new ErrorParsingNotification({
        message: 'Error extracting data from notification',
        cause: e,
        data,
      }),
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(AcceptedNotificationTypes)),
    Effect.catchTag(
      'ParseError',
      (e) =>
        new ErrorParsingNotification({
          message:
            'Error decoding notification data into an accepted notification type',
          cause: e,
          data,
        })
    )
  )
}

import {Option, pipe, Schema} from 'effect'
import type * as Notifications from 'expo-notifications'
import {Platform} from 'react-native'

const NotificationData = Schema.Record({
  key: Schema.String,
  value: Schema.Union(Schema.String, Schema.Number, Schema.Object),
})
export type NotificationData = typeof NotificationData.Type

const BackgroundNotificationSchema = Schema.Struct({
  notification: Schema.NullOr(NotificationData),
  data: Schema.Struct(
    {
      dataString: Schema.optional(Schema.parseJson(NotificationData)),
    },
    {
      key: Schema.String,
      value: Schema.Union(Schema.String, Schema.Number, Schema.Object),
    }
  ),
})

const AndroidInHookNotification = Schema.Struct({
  request: Schema.Struct({
    trigger: Schema.Struct({
      remoteMessage: Schema.Struct({
        notification: Schema.NullishOr(Schema.Object),
        data: Schema.Struct({
          body: Schema.String,
        }),
      }),
    }),
  }),
})

const IOSInHookNotification = Schema.Struct({
  request: Schema.Struct({
    content: Schema.Struct({
      body: Schema.NullishOr(Schema.String),
      data: NotificationData,
    }),
  }),
})

/**
 * Extracts data payload from notification. Further decoding is needed. This function simply returns the data payload as received from the callback.
 * Can be called with data from background task or hook.
 *
 * @param notification
 */
export function extractDataPayloadFromNotification(
  data:
    | {
        source: 'background'
        data: Notifications.NotificationTaskPayload
      }
    | {
        source: 'hook'
        data: Notifications.Notification
      }
): Option.Option<{payload: NotificationData; isHeadless: boolean}> {
  try {
    if (data.source === 'background') {
      return pipe(
        Schema.decodeUnknownOption(BackgroundNotificationSchema)(data.data),
        Option.map((one) => ({
          payload: one.data.dataString ?? {},
          isHeadless: !!one.notification,
        })),
        Option.filter((one): boolean => !!one.payload)
      )
    }

    if (Platform.OS === 'android') {
      if (data.source === 'hook') {
        return pipe(
          Schema.decodeUnknownOption(AndroidInHookNotification)(data.data),
          Option.map((one) => ({
            payload: one.request.trigger.remoteMessage.data.body,
            isHeadless: !one.request.trigger.remoteMessage.notification,
          })),
          Option.flatMap(({payload, isHeadless}) => {
            return pipe(
              Schema.decodeOption(Schema.parseJson(NotificationData))(payload),
              Option.map((one) => ({
                payload: one,
                isHeadless,
              }))
            )
          })
        )
      }
    }

    if (Platform.OS === 'ios') {
      if (data.source === 'hook') {
        return pipe(
          Schema.decodeUnknownOption(IOSInHookNotification)(data.data),
          Option.map((one) => ({
            payload: one.request.content.data,
            isHeadless: !one.request.content.body,
          }))
        )
      }
    }

    return Option.none() // WHAT DA FUCK?
  } catch (e) {
    console.error('Error parsing notification content', e)
    return Option.none()
  }
}

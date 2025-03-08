import {Schema} from 'effect'
import {Platform} from 'react-native'

export const NotificationData = Schema.Struct({
  data:
    Platform.OS === 'android'
      ? Schema.Struct({
          body: Schema.parseJson(Schema.Any),
        })
      : Schema.Any,
})

export type NotificationData = typeof NotificationData.Type

export const decodeNotificationData =
  Schema.decodeUnknownOption(NotificationData)

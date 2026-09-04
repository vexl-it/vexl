import {Schema} from 'effect'
import {Platform} from 'react-native'

// Keys read by android/.../VexlPresentationDelegate.kt.

export const AndroidNotificationGroupData = Schema.Struct({
  androidGroupId: Schema.String,
  androidGroupSummary: Schema.Boolean,
})
export type AndroidNotificationGroupData =
  typeof AndroidNotificationGroupData.Type

export const decodeAndroidNotificationGroupData = Schema.decodeUnknownOption(
  AndroidNotificationGroupData
)

export function androidNotificationGroupData({
  groupId,
  isSummary = false,
}: {
  groupId: string
  isSummary?: boolean
}): Partial<AndroidNotificationGroupData> {
  if (Platform.OS !== 'android') return {}
  return {androidGroupId: groupId, androidGroupSummary: isSummary}
}

export const AndroidConversationMessage = Schema.Struct({
  uuid: Schema.String,
  text: Schema.String,
  timestamp: Schema.Number,
})
export type AndroidConversationMessage = typeof AndroidConversationMessage.Type

// Sender avatar: inline SVG markup rasterized natively, or a file / content /
// data URI the notification service can open.
export const AndroidConversationAvatar = Schema.Union(
  Schema.Struct({type: Schema.Literal('svgXml'), svgXml: Schema.String}),
  Schema.Struct({type: Schema.Literal('imageUri'), imageUri: Schema.String})
)
export type AndroidConversationAvatar = typeof AndroidConversationAvatar.Type

// Renders the notification with Android's MessagingStyle: one notification
// per conversation listing its messages.
export const AndroidConversationData = Schema.Struct({
  androidConversation: Schema.Struct({
    senderName: Schema.String,
    avatar: Schema.optional(AndroidConversationAvatar),
    messages: Schema.Array(AndroidConversationMessage),
  }),
})
export type AndroidConversationData = typeof AndroidConversationData.Type

export const decodeAndroidConversationData = Schema.decodeUnknownOption(
  AndroidConversationData
)

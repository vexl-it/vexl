import {Schema} from 'effect'
import {Platform} from 'react-native'

// Read by android/.../GroupingPresentationDelegate.kt.
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

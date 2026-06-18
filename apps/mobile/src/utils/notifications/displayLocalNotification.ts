import {
  AndroidImportance,
  type NotificationContentInput,
  scheduleNotificationAsync,
  setNotificationHandler,
} from 'expo-notifications'
import {Platform} from 'react-native'

// Notifee displayed every notification it was asked to immediately, even in the
// foreground. expo-notifications instead routes locally presented notifications
// (scheduled with an immediate trigger) through this global handler, so we ask
// it to always surface them as a banner, in the notification list and with
// sound.
setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

/**
 * Presents a notification on the device immediately. This is the
 * expo-notifications replacement for notifee's `displayNotification` and only
 * displays a notification locally - it does not touch the network or the push
 * token. The returned string is the notification identifier (equivalent to the
 * id notifee returned), usable later with `dismissNotificationAsync`.
 *
 * On Android the `channelId` (when provided) is passed via the trigger so the
 * channel's importance is applied; on iOS channels do not exist so an immediate
 * `null` trigger is used.
 */
export async function displayLocalNotification({
  id,
  content,
  channelId,
}: {
  id?: string
  // expo-notifications omits `threadIdentifier` from `NotificationContentInput`
  // in its TS types, but the native iOS module does read it from the content
  // (see expo-notifications NotificationRecords.swift) and uses it to thread
  // notifications in the iOS notification center. We surface it here in a
  // type-safe way (without `as`). It is ignored on Android.
  content: NotificationContentInput & {threadIdentifier?: string}
  channelId?: string
}): Promise<string> {
  return await scheduleNotificationAsync({
    ...(id ? {identifier: id} : {}),
    content,
    trigger: Platform.OS === 'android' && channelId ? {channelId} : null,
  })
}

export {AndroidImportance}

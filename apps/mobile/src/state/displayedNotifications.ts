import {atomWithParsedMmkvStorage} from '../utils/atomUtils/atomWithParsedMmkvStorage'
import {z} from 'zod'
import {NotificationId} from '../utils/notifications/NotificationId.brand'
import {atom, useSetAtom} from 'jotai'
import notifee from '@notifee/react-native'
import {focusAtom} from 'jotai-optics'
import {useAppState} from '../utils/useAppState'
import {useCallback} from 'react'
import {ChatNotificationData} from '../utils/notifications/ChatNotificationData'
import {
  type ChatWithMessagesAtom,
  focusChatInfoAtom,
} from './chat/atoms/focusChatWithMessagesAtom'

const StoredNotification = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('chat'),
    notificationId: NotificationId,
    notificationData: ChatNotificationData,
  }),
  z.object({
    type: z.literal('inactivityReminder'),
    notificationId: NotificationId,
  }),
])
type StoredNotification = z.TypeOf<typeof StoredNotification>

const displayedNotificationsStorageAtom = atomWithParsedMmkvStorage(
  'displayedNotifications',
  {displayedNotifications: []},
  z.object({
    displayedNotifications: z.array(StoredNotification),
  })
)

export const displayedNotificationsAtom = focusAtom(
  displayedNotificationsStorageAtom,
  (o) => o.prop('displayedNotifications')
)

const cancelNotificationsFailSilentlyActionAtom = atom(
  null,
  (get, set, notificationIds: NotificationId[]) => {
    void Promise.all(
      notificationIds.map(async (notificationId) => {
        try {
          await notifee.cancelNotification(notificationId)
        } catch (e) {
          console.warn('Unable to cancel notification', notificationId)
        }
      })
    )

    set(displayedNotificationsAtom, (prev) =>
      prev.filter((one) => !notificationIds.includes(one.notificationId))
    )
  }
)

export const addNotificationToDisplayedNotificationsActionAtom = atom(
  null,
  (get, set, notification: StoredNotification) => {
    set(displayedNotificationsAtom, (prev) => [...prev, notification])
  }
)

export const hideNotificationsForChatActionAtom = atom(
  null,
  (get, set, chat: ChatWithMessagesAtom) => {
    const chatInfo = get(focusChatInfoAtom(chat))

    if (!chatInfo) return

    const notificationIdsToRemove = get(displayedNotificationsAtom)
      .filter(
        (one) =>
          one.type === 'chat' &&
          one.notificationData.inbox ===
            chatInfo.inbox.privateKey.publicKeyPemBase64 &&
          one.notificationData.sender === chatInfo.otherSide.publicKey
      )
      .map((one) => one.notificationId)

    set(cancelNotificationsFailSilentlyActionAtom, notificationIdsToRemove)
  }
)

export const hideInactivityReminderNotificationsActionAtom = atom(
  null,
  (get, set) => {
    const notificationIdsToRemove = get(displayedNotificationsAtom)
      .filter((one) => one.type === 'inactivityReminder')
      .map((one) => one.notificationId)

    set(cancelNotificationsFailSilentlyActionAtom, notificationIdsToRemove)
  }
)

export function useHideInactivityReminderNotificationsOnResume(): void {
  const hideInactivityReminderNotifications = useSetAtom(
    hideInactivityReminderNotificationsActionAtom
  )

  useAppState(
    useCallback(
      (state) => {
        if (state === 'active') hideInactivityReminderNotifications()
      },
      [hideInactivityReminderNotifications]
    )
  )
}

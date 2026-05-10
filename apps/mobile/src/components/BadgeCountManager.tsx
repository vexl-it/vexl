import notifee from '@notifee/react-native'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {unreadChatsCountAtom} from '../state/chat/atoms/unreadChatsCountAtom'
import reportError from '../utils/reportError'
import {notSeenNotificationCountAtom} from './NotificationsScreen/state'

export const refreshNotificationBadgeCountActionAtom = atom(null, (get) => {
  const unreadChatsCount = get(unreadChatsCountAtom)
  const notSeenNotificationsCount = get(notSeenNotificationCountAtom)

  notifee
    .setBadgeCount(unreadChatsCount + notSeenNotificationsCount)
    .catch((err) => {
      reportError('warn', new Error('Failed to set badge count'), {err})
    })
})

function BadgeCountManager(): null {
  const unreadChatsCount = useAtomValue(unreadChatsCountAtom)
  const notSeenNotificationsCount = useAtomValue(notSeenNotificationCountAtom)
  const refreshNotificationBadge = useSetAtom(
    refreshNotificationBadgeCountActionAtom
  )

  useEffect(() => {
    void unreadChatsCount
    void notSeenNotificationsCount

    refreshNotificationBadge()
  }, [unreadChatsCount, notSeenNotificationsCount, refreshNotificationBadge])

  return null
}

export default BadgeCountManager

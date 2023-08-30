import {useAtomValue} from 'jotai'
import {unreadChatsCountAtom} from '../state/chat/atoms/unreadChatsCountAtom'
import {useEffect} from 'react'
import notifee from '@notifee/react-native'
import reportError from '../utils/reportError'

function BadgeCountManager(): null {
  const unreadChatsCount = useAtomValue(unreadChatsCountAtom)
  useEffect(() => {
    notifee.setBadgeCount(unreadChatsCount).catch((err) => {
      reportError('warn', 'Failed to set badge count', err)
    })
  }, [unreadChatsCount])

  return null
}

export default BadgeCountManager

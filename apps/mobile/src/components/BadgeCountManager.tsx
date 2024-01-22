import notifee from '@notifee/react-native'
import {useAtomValue} from 'jotai'
import {useEffect} from 'react'
import {unreadChatsCountAtom} from '../state/chat/atoms/unreadChatsCountAtom'
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

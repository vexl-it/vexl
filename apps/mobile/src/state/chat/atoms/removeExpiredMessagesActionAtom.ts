import {Array, pipe} from 'effect'
import {atom, useStore} from 'jotai'
import {useCallback} from 'react'
import {type AppStateStatus} from 'react-native'
import removeFile from '../../../utils/removeFile'
import {useAppState} from '../../../utils/useAppState'
import {splitExpiredMessages} from '../utils/disappearingMessages'
import messagingStateAtom from './messagingStateAtom'

const CHECK_INTERVAL_MS = 10_000

export const removeExpiredMessagesActionAtom = atom(null, (get, set) => {
  const now = Date.now()
  const inboxes = pipe(
    get(messagingStateAtom),
    Array.map((inbox) => ({
      inbox,
      chats: Array.map(inbox.chats, (chat) => splitExpiredMessages(chat, now)),
    }))
  )

  const expired = pipe(
    inboxes,
    Array.flatMap((one) => one.chats),
    Array.flatMap((one) => one.expired)
  )
  if (!Array.isNonEmptyArray(expired)) return

  set(
    messagingStateAtom,
    Array.map(inboxes, ({inbox, chats}) => ({
      ...inbox,
      chats: Array.map(chats, (one) => one.chat),
    }))
  )

  pipe(
    expired,
    Array.forEach(({message}) => {
      if (message.image) void removeFile(message.image)()
    })
  )
})

export function useRemoveExpiredMessages(): void {
  const store = useStore()

  useAppState(
    useCallback(
      (appState: AppStateStatus) => {
        if (appState !== 'active') return

        store.set(removeExpiredMessagesActionAtom)
        const interval = setInterval(() => {
          store.set(removeExpiredMessagesActionAtom)
        }, CHECK_INTERVAL_MS)
        return () => {
          clearInterval(interval)
        }
      },
      [store]
    )
  )
}

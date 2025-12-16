import {useIsFocused} from '@react-navigation/native'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect/index'
import {useAtom, useSetAtom} from 'jotai'
import {useEffect, useMemo} from 'react'
import focusIsUnReadAtom from '../../../state/chat/atoms/focusIsUnReadAtom'
import {sendMessageReadActionAtom} from '../../../state/chat/atoms/sendMessageReadActionAtom'
import {chatMolecule} from '../atoms'

export default function MarkAsReadWhenRendered(): null {
  const isFocused = useIsFocused()
  const {chatAtom, lastMessageAtom} = useMolecule(chatMolecule)
  const [isUnread, setIsUnread] = useAtom(
    useMemo(() => focusIsUnReadAtom(chatAtom), [chatAtom])
  )
  const sendMessageRead = useSetAtom(sendMessageReadActionAtom)

  useEffect(() => {
    if (isUnread && isFocused) {
      setIsUnread(false)
      Effect.runFork(sendMessageRead({chatAtom, lastMessageAtom}))
    }
  }, [
    isUnread,
    setIsUnread,
    isFocused,
    sendMessageRead,
    chatAtom,
    lastMessageAtom,
  ])

  return null
}

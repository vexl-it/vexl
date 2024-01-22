import {useIsFocused} from '@react-navigation/native'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {useAtom, type PrimitiveAtom} from 'jotai'
import {useEffect, useMemo} from 'react'
import focusIsUnReadAtom from '../../../state/chat/atoms/focusIsUnReadAtom'

export default function MarkAsReadWhenRendered({
  chatAtom,
}: {
  chatAtom: PrimitiveAtom<Chat>
}): null {
  const isFocused = useIsFocused()
  const [isUnread, setIsUnread] = useAtom(
    useMemo(() => focusIsUnReadAtom(chatAtom), [chatAtom])
  )

  useEffect(() => {
    if (isUnread && isFocused) {
      setIsUnread(false)
    }
  }, [isUnread, setIsUnread, isFocused])

  return null
}

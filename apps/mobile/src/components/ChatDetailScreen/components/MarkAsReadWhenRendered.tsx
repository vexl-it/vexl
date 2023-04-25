import {type PrimitiveAtom, useAtom} from 'jotai'
import {type Chat} from '@vexl-next/domain/dist/general/messaging'
import {useIsFocused} from '@react-navigation/native'
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

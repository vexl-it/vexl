import {type ChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {atom, useAtom, type PrimitiveAtom, type SetStateAction} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {useCallback, useMemo} from 'react'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'

const HideForMessageAtomType = z.object({
  hidden: z.boolean(),
})

export default function createHideActionForMessageMmkvAtom(
  messageId: ChatMessageId
): PrimitiveAtom<boolean> {
  const atom = atomWithParsedMmkvStorage(
    `hideForMessage-${messageId}`,
    {hidden: false},
    HideForMessageAtomType
  )

  return focusAtom(atom, (p) => p.prop('hidden'))
}

export function useHideActionForMessage(
  messageId?: ChatMessageId
): [boolean, () => void] {
  const [hide, setHide] = useAtom(
    useMemo((): PrimitiveAtom<boolean> => {
      if (!messageId) {
        return atom<boolean, [SetStateAction<boolean>], unknown>(
          () => false,
          () => {}
        )
      }
      return createHideActionForMessageMmkvAtom(messageId)
    }, [messageId])
  )

  return [
    hide,
    useCallback(() => {
      setHide(true)
    }, [setHide]),
  ]
}

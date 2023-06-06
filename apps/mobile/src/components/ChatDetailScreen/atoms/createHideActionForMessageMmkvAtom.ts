import {z} from 'zod'
import {type ChatMessageId} from '@vexl-next/domain/dist/general/messaging'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {type PrimitiveAtom, type SetStateAction, useAtom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atom} from 'jotai'
import {useCallback, useMemo} from 'react'

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

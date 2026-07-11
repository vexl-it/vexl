import {type ChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {Schema} from 'effect/index'
import {atom, useAtom, type PrimitiveAtom, type SetStateAction} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {useCallback, useMemo} from 'react'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {registerDynamicMmkvKeyFamily} from '../../../utils/atomUtils/mmkvMigrationRegistry'

export const HIDE_FOR_MESSAGE_KEY_PREFIX = 'hideForMessage-'

// Dynamic key family: one key per hidden message. Atom instances are created
// per mount (below), so per-key flush fns register under this family.
registerDynamicMmkvKeyFamily({
  prefix: HIDE_FOR_MESSAGE_KEY_PREFIX,
  parseKey: (key) =>
    key.startsWith(HIDE_FOR_MESSAGE_KEY_PREFIX) &&
    key.length > HIDE_FOR_MESSAGE_KEY_PREFIX.length,
  policy: 'account',
  nativeType: 'string',
})

export default function createHideActionForMessageMmkvAtom(
  messageId: ChatMessageId
): PrimitiveAtom<boolean> {
  const atom = atomWithParsedMmkvStorage(
    `${HIDE_FOR_MESSAGE_KEY_PREFIX}${messageId}`,
    {hidden: false},
    Schema.Struct({
      hidden: Schema.Boolean,
    }),
    'account'
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

import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {type PrimitiveAtom} from 'jotai'
import {focusAtom} from 'jotai-optics'

export default function focusIsUnReadAtom(
  chatAtom: PrimitiveAtom<Chat>
): PrimitiveAtom<boolean> {
  return focusAtom(chatAtom, (optic) => optic.prop('isUnread'))
}

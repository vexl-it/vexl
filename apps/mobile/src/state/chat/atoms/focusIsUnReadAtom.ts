import {type Chat} from '@vexl-next/domain/dist/general/messaging'
import {focusAtom} from 'jotai-optics'
import {type PrimitiveAtom} from 'jotai'

export default function focusIsUnReadAtom(
  chatAtom: PrimitiveAtom<Chat>
): PrimitiveAtom<boolean> {
  return focusAtom(chatAtom, (optic) => optic.prop('isUnread'))
}

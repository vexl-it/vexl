import {type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {type ChatWithMessages} from '../domain'

export default function createIsCancelledAtom(
  chatAtom: Atom<ChatWithMessages>
): Atom<boolean> {
  return selectAtom(
    chatAtom,
    ({messages}) =>
      messages.at(-1)?.message.messageType === 'CANCEL_REQUEST_MESSAGING'
  )
}

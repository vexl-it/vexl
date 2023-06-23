import {type ChatWithMessages} from '../domain'
import {type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'

export default function createIsCancelledAtom(
  chatAtom: Atom<ChatWithMessages>
): Atom<boolean> {
  return selectAtom(
    chatAtom,
    ({messages}) =>
      messages.at(-1)?.message.messageType === 'CANCEL_REQUEST_MESSAGING'
  )
}

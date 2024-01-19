import {type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

export default function focusRequestMessageAtom(
  chatAtom: Atom<ChatWithMessages>
): Atom<ChatMessageWithState | null> {
  return selectAtom(
    chatAtom,
    ({messages}) => {
      return (
        messages
          .filter((one) => one.message.messageType === 'REQUEST_MESSAGING')
          .at(-1) ?? null
      )
    },
    (a, b) =>
      a?.message.uuid === b?.message.uuid &&
      a?.message.messageType === b?.message.messageType
  )
}

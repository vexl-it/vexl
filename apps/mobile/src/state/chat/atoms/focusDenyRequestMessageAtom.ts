import {type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

export default function focusDenyRequestMessageAtom(
  chatAtom: Atom<ChatWithMessages>
): Atom<ChatMessageWithState | null> {
  return selectAtom(
    chatAtom,
    ({messages}) => {
      return (
        messages.find(
          (one) => one.message.messageType === 'DISAPPROVE_MESSAGING'
        ) ?? null
      )
    },
    (a, b) =>
      a?.message.uuid === b?.message.uuid &&
      a?.message.messageType === b?.message.messageType
  )
}

export function focusWasDeniedAtom(
  chatAtom: Atom<ChatWithMessages>
): Atom<boolean> {
  return selectAtom(chatAtom, ({messages}) => {
    return messages.some(
      (one) => one.message.messageType === 'DISAPPROVE_MESSAGING'
    )
  })
}

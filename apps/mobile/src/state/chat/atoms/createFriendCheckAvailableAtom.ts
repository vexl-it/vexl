import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Array} from 'effect'
import {atom, type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {type ChatWithMessages} from '../domain'
import isNoteChatOrigin from '../utils/isNoteChatOrigin'
import {createCanSendMessagesAtom} from './createCanSendMessagesAtom'

export function createFriendCheckAvailableAtom({
  chatWithMessagesAtom,
  commonConnectionsHashesAtom,
}: {
  chatWithMessagesAtom: Atom<ChatWithMessages>
  commonConnectionsHashesAtom: Atom<readonly HashedPhoneNumber[]>
}): Atom<boolean> {
  const isNoteChatAtom = selectAtom(chatWithMessagesAtom, (o) =>
    isNoteChatOrigin(o.chat.origin)
  )
  const canSendMessagesAtom = createCanSendMessagesAtom(
    selectAtom(chatWithMessagesAtom, (o) => o.messages)
  )

  return atom(
    (get) =>
      !get(isNoteChatAtom) &&
      get(canSendMessagesAtom) &&
      Array.isNonEmptyReadonlyArray(get(commonConnectionsHashesAtom))
  )
}

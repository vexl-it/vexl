import {type ChatWithMessagesAtom} from './focusChatWithMessagesAtom'
import {atom, type Atom} from 'jotai'
import {offerRerequestLimitDaysAtom} from '../../../utils/remoteConfig/atoms'
import {canChatBeRequested} from '../utils/offerStates'

export default function createCanChatBeRerequestedAtom(
  chatAtom: ChatWithMessagesAtom
): Atom<ReturnType<typeof canChatBeRequested>> {
  return atom((get) => {
    const chat = get(chatAtom)
    if (!chat) return {canBeRerequested: false}

    const limitDays = get(offerRerequestLimitDaysAtom)
    return canChatBeRequested(chat, limitDays)
  })
}

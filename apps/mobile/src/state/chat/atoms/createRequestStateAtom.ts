import {type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {type ChatWithMessages, type RequestState} from '../domain'
import {getRequestState} from '../utils/offerStates'

export function createRequestStateAtom(
  chatAtom: Atom<ChatWithMessages>
): Atom<RequestState> {
  return selectAtom(chatAtom, (chat) => {
    return getRequestState(chat)
  })
}

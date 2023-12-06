import {atom} from 'jotai'
import type {FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import type {ChatIds, ChatWithMessages} from '../../../state/chat/domain'
import {dummyChatWithMessages} from '../../ChatDetailScreen/atoms'
import type {SetStateAction} from 'jotai/index'
import valueOrDefaultAtom from '../../../utils/atomUtils/valueOrDefaultAtom'
import focusChatWithMessagesAtom from '../../../state/chat/atoms/focusChatWithMessagesAtom'
import {focusAtom} from 'jotai-optics'
import {offerForChatOriginAtom} from '../../../state/marketplace/atoms/offersState'
import {type OneOfferInState} from '@vexl-next/domain/dist/general/offers'
import {getOtherSideData} from '../../../state/chat/atoms/selectOtherSideDataAtom'

export const parentChatAtomAtom = atom<FocusAtomType<ChatWithMessages>>(
  atom(dummyChatWithMessages)
)

export const chatWithMessagesAtom = atom(
  (get) => get(get(parentChatAtomAtom)),
  (get, set, update: SetStateAction<ChatWithMessages>) => {
    const chatWithMessagesAtom = get(parentChatAtomAtom)
    set(chatWithMessagesAtom, update)
  }
)

export const tradeChecklistDataAtom = focusAtom(chatWithMessagesAtom, (p) =>
  p.prop('tradeChecklist')
)

export const tradeChecklistDataToChecklistItem = {
  DATE_AND_TIME: focusAtom(tradeChecklistDataAtom, (o) =>
    o.prop('dateAndTime')
  ),
  CALCULATE_AMOUNT: focusAtom(tradeChecklistDataAtom, (o) => o.prop('amount')),
  SET_NETWORK: focusAtom(tradeChecklistDataAtom, (o) => o.prop('network')),
  MEETING_LOCATION: focusAtom(tradeChecklistDataAtom, (o) =>
    o.prop('location')
  ),
  REVEAL_IDENTITY: focusAtom(tradeChecklistDataAtom, (o) => o.prop('identity')),
  REVEAL_PHONE_NUMBER: focusAtom(tradeChecklistDataAtom, (o) =>
    o.prop('identity')
  ),
} as const

const chatOriginAtom = focusAtom(chatWithMessagesAtom, (p) =>
  p.prop('chat').prop('origin')
)
export const originOfferAtom = atom<OneOfferInState | undefined>((get) => {
  const chatOrigin = get(chatOriginAtom)
  // TODO is is ok to create an atom here?
  //  It might not be a problem since we would have to find the value anyway
  //  Better to check
  return get(offerForChatOriginAtom(chatOrigin))
})

export const otherSideDataAtom = atom((get) => {
  const chatData = get(chatWithMessagesAtom)
  return getOtherSideData(chatData.chat)
})

export const setParentChatActionAtom = atom(
  null,
  (get, set, params: ChatIds) => {
    const parentChatAtom = get(parentChatAtomAtom)
    const parentChat = get(parentChatAtom)

    if (parentChat?.chat.id === params.chatId) return // No changes

    const newChatAtom = valueOrDefaultAtom({
      nullableAtom: focusChatWithMessagesAtom(params),
      dummyValue: dummyChatWithMessages,
    })
    set(parentChatAtomAtom, newChatAtom)
  }
)

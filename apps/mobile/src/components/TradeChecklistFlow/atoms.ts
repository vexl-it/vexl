import {atom} from 'jotai'
import {type MainTradeCheckListState} from './domain'
import {offerForChatOriginAtom} from '../../state/marketplace/atoms/offersState'
import focusChatWithMessagesAtom from '../../state/chat/atoms/focusChatWithMessagesAtom'
import valueOrDefaultAtom from '../../utils/atomUtils/valueOrDefaultAtom'
import {dummyChatWithMessages} from '../ChatDetailScreen/atoms'
import {type OneOfferInState} from '@vexl-next/domain/dist/general/offers'
import deepEqual from 'deep-equal'
import {type ChatDataForTradeChecklist} from '../../state/tradeChecklist/domain'

export const offerForTradeChecklistAtom = atom<OneOfferInState | null>(null)

export const chatDataForTradeChecklistAtom = atom<
  ChatDataForTradeChecklist | undefined
>(undefined)

export const mainTradeCheckListStateAtom = atom<MainTradeCheckListState>({
  'DATE_AND_TIME': {
    status: 'unknown',
    data: [],
  },
  'MEETING_LOCATION': {
    status: 'unknown',
  },
  'CALCULATE_AMOUNT': {
    status: 'unknown',
  },
  'SET_NETWORK': {
    status: 'unknown',
  },
  'REVEAL_IDENTITY': {
    status: 'unknown',
  },
  'REVEAL_PHONE_NUMBER': {
    status: 'unknown',
  },
})

export const syncTradeCheckListStateWithChatActionAtom = atom(
  null,
  (get, set, params: ChatDataForTradeChecklist) => {
    const chatDataForTradeChecklist = get(chatDataForTradeChecklistAtom)

    if (!deepEqual(chatDataForTradeChecklist, params)) {
      const {chatId, inboxKey} = params
      const chatWithMessagesAtom = valueOrDefaultAtom({
        nullableAtom: focusChatWithMessagesAtom({chatId, inboxKey}),
        dummyValue: dummyChatWithMessages,
      })

      const origin = get(chatWithMessagesAtom)?.chat.origin
      set(
        offerForTradeChecklistAtom,
        get(offerForChatOriginAtom(origin)) ?? null
      )

      set(mainTradeCheckListStateAtom, (prev) => ({
        ...prev,
        'DATE_AND_TIME': {
          status: 'unknown',
          data: [],
        },
      }))
    }
  }
)

export const submitChangesAndSendMessageActionAtom = atom(null, () => {
  return Promise.resolve(true)
})

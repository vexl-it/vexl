import {createEmptyTradeChecklistInState} from '../../tradeChecklist/domain'
import {type ChatWithMessages} from '../domain'

export function resetTradeChecklist(chat: ChatWithMessages): ChatWithMessages {
  return {
    ...chat,
    tradeChecklist: createEmptyTradeChecklistInState(),
  }
}

export function resetRealLifeInfo(chat: ChatWithMessages): ChatWithMessages {
  return {
    ...chat,
    chat: {
      ...chat.chat,
      otherSide: {
        ...chat.chat.otherSide,
        realLifeInfo: undefined,
      },
    },
  }
}

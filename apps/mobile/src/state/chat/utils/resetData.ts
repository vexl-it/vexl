import {type ChatWithMessages} from '../domain'

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

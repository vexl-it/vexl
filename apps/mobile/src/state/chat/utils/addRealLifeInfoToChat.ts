import {type RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {
  type ContactReveal,
  type IdentityReveal,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {type ChatWithMessages} from '../domain'
import processTradeChecklistContactRevealMessageIfAny from './processTradeChecklistContactRevealMessageIfAny'
import processTradeChecklistIdentityRevealMessageIfAny from './processTradeChecklistIdentityRevealMessageIfAny'

function setRealLifeInfo(
  realLifeInfo: RealLifeInfo | undefined
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => ({
    ...chat,
    chat: {
      ...chat.chat,
      otherSide: {
        ...chat.chat.otherSide,
        realLifeInfo,
      },
    },
  })
}

export function addIdentityRealLifeInfoToChat(
  identityRevealData: IdentityReveal | undefined
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => {
    if (identityRevealData) {
      const dataFromIdentityReveal =
        processTradeChecklistIdentityRevealMessageIfAny(
          identityRevealData,
          chat.chat
        )

      return setRealLifeInfo(dataFromIdentityReveal)(chat)
    }

    return chat
  }
}

export function addContactRealLifeInfoToChat(
  contactRevealData: ContactReveal | undefined
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => {
    if (contactRevealData) {
      const dataFromContactReveal =
        processTradeChecklistContactRevealMessageIfAny(
          contactRevealData,
          chat.chat.otherSide.realLifeInfo
        )
      return setRealLifeInfo(dataFromContactReveal)(chat)
    }

    return chat
  }
}

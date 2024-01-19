import {type RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {
  type ContactReveal,
  type IdentityReveal,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {type ChatWithMessages} from '../domain'
import processTradeChecklistContactRevealMessageIfAny from './processTradeChecklistContactRevealMessageIfAny'
import processTradeChecklistIdentityRevealMessageIfAny from './processTradeChecklistIdentityRevealMessageIfAny'

function setRealLifeInfo(
  realLifeInfo: RealLifeInfo
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

export default function addRealLifeInfoToChat(
  identityRevealData: IdentityReveal | undefined,
  contactRevealData: ContactReveal | undefined
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => {
    const dataFromIdentityReveal =
      processTradeChecklistIdentityRevealMessageIfAny(identityRevealData)

    const dataFromContactReveal =
      processTradeChecklistContactRevealMessageIfAny(
        contactRevealData,
        chat.chat.otherSide.realLifeInfo
      )

    if (dataFromIdentityReveal)
      return setRealLifeInfo(dataFromIdentityReveal)(chat)
    if (dataFromContactReveal)
      return setRealLifeInfo(dataFromContactReveal)(chat)

    return chat
  }
}

import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

function appendPhoneNumberToRealLifeInfo(
  fullPhoneNumber: E164PhoneNumber
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => {
    const realLifeInfo = chat.chat.otherSide.realLifeInfo
      ? {...chat.chat.otherSide.realLifeInfo, fullPhoneNumber}
      : undefined

    return {
      ...chat,
      chat: {
        ...chat.chat,
        otherSide: {
          ...chat.chat.otherSide,
          realLifeInfo,
        },
      },
    }
  }
}

export default function processContactRevealMessageIfAny(
  contactRevealMessage?: ChatMessageWithState
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => {
    if (!contactRevealMessage?.message.deanonymizedUser?.fullPhoneNumber)
      return chat

    return appendPhoneNumberToRealLifeInfo(
      contactRevealMessage.message.deanonymizedUser.fullPhoneNumber
    )(chat)
  }
}

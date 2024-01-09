import {type UserNameAndAvatar} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import avatarsSvg from '../../../components/AnonymousAvatar/images/avatarsSvg'
import {randomNumberFromSeed} from '../../../utils/randomNumber'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

function setRealLifeInfo(
  realLifeInfo: UserNameAndAvatar
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

export default function processIdentityRevealMessageIfAny(
  identityRevealMessage?: ChatMessageWithState
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => {
    if (!identityRevealMessage?.message.deanonymizedUser?.name) return chat

    const realLifeInfo: UserNameAndAvatar = {
      userName: identityRevealMessage.message.deanonymizedUser.name,
      // @ts-expect-error TODO: typescript error
      image: identityRevealMessage.message.image
        ? {
            type: 'imageUri',
            imageUri: resolveLocalUri(identityRevealMessage.message.image),
          }
        : {
            type: 'svgXml',
            svgXml:
              avatarsSvg[
                randomNumberFromSeed(
                  0,
                  avatarsSvg.length - 1,
                  identityRevealMessage.message.deanonymizedUser.name
                )
              ],
          },
    }
    return setRealLifeInfo(realLifeInfo)(chat)
  }
}

import {type RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {
  fromImageUri,
  fromSvgString,
} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import goldenAvatarImages from '../../../components/AnonymousAvatar/images/avatarsGoldenGlassesAndBackgroundSvg'
import basicAvatarImages from '../../../components/AnonymousAvatar/images/avatarsSvg'
import {randomNumberFromSeed} from '../../../utils/randomNumber'
import {randomSeedFromChat} from '../../../utils/RandomSeed'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

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

export default function processIdentityRevealMessageIfAny(
  identityRevealMessage?: ChatMessageWithState
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => {
    if (!identityRevealMessage?.message.deanonymizedUser?.name) return chat

    const goldenAvatarType =
      chat.chat.origin.type === 'theirOffer'
        ? chat.chat.origin.offer?.offerInfo.publicPart.goldenAvatarType
        : chat.chat.otherSide.goldenAvatarType
    const anonymousAvatars =
      goldenAvatarType === 'BACKGROUND_AND_GLASSES'
        ? goldenAvatarImages
        : basicAvatarImages

    const realLifeInfo: RealLifeInfo = {
      userName: identityRevealMessage.message.deanonymizedUser.name,
      image: identityRevealMessage.message.image
        ? fromImageUri(resolveLocalUri(identityRevealMessage.message.image))
        : fromSvgString(
            anonymousAvatars[
              randomNumberFromSeed(
                0,
                anonymousAvatars.length - 1,
                randomSeedFromChat(chat.chat)
              )
            ] ?? anonymousAvatars[0]
          ),
      partialPhoneNumber:
        identityRevealMessage.message.deanonymizedUser.partialPhoneNumber,
    }
    return setRealLifeInfo(realLifeInfo)(chat)
  }
}

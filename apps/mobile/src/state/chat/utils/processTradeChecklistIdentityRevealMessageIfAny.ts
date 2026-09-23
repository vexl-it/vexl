import {type RevealedRealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {type IdentityReveal} from '@vexl-next/domain/src/general/tradeChecklist'
import {
  fromImageUri,
  fromSvgString,
} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import goldenAvatarImages from '../../../components/AnonymousAvatar/images/avatarsGoldenGlassesAndBackgroundSvg'
import basicAvatarImages from '../../../components/AnonymousAvatar/images/avatarsSvg'
import {randomSeedFromChat} from '../../../utils/RandomSeed'
import {randomNumberFromSeed} from '../../../utils/randomNumber'
import resolveLocalUri from '../../../utils/resolveLocalUri'

export function anonymousAvatarForChat(
  chat: Chat
): RevealedRealLifeInfo['image'] {
  const goldenAvatarType =
    chat.origin.type === 'theirOffer'
      ? chat.origin.offer?.offerInfo.publicPart.goldenAvatarType
      : chat.otherSide.goldenAvatarType
  const anonymousAvatars =
    goldenAvatarType === 'BACKGROUND_AND_GLASSES'
      ? goldenAvatarImages
      : basicAvatarImages

  return fromSvgString(
    anonymousAvatars[
      randomNumberFromSeed(
        0,
        anonymousAvatars.length - 1,
        randomSeedFromChat(chat)
      )
    ] ?? anonymousAvatars[0]
  )
}

export default function processTradeChecklistIdentityRevealMessageIfAny(
  identityRevealData: IdentityReveal | undefined,
  chat: Chat
): RevealedRealLifeInfo | undefined {
  const name = identityRevealData?.deanonymizedUser?.name
  const image = identityRevealData?.image
  if (!name && !image) return undefined

  const existingInfo = chat.otherSide.realLifeInfo

  return {
    userName: name ?? existingInfo?.userName,
    image: image
      ? fromImageUri(resolveLocalUri(image))
      : (existingInfo?.image ?? anonymousAvatarForChat(chat)),
    partialPhoneNumber:
      identityRevealData?.deanonymizedUser?.partialPhoneNumber ??
      existingInfo?.partialPhoneNumber,
  }
}

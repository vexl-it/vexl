import {type RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
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

export default function processTradeChecklistIdentityRevealMessageIfAny(
  identityRevealData: IdentityReveal | undefined,
  chat: Chat
): RealLifeInfo | undefined {
  if (!identityRevealData?.deanonymizedUser?.name) return undefined
  const goldenAvatarType =
    chat.origin.type === 'theirOffer'
      ? chat.origin.offer?.offerInfo.publicPart.goldenAvatarType
      : chat.otherSide.goldenAvatarType
  const anonymousAvatars =
    goldenAvatarType === 'BACKGROUND_AND_GLASSES'
      ? goldenAvatarImages
      : basicAvatarImages

  return {
    userName: identityRevealData.deanonymizedUser.name,
    image: identityRevealData.image
      ? fromImageUri(resolveLocalUri(identityRevealData.image))
      : fromSvgString(
          anonymousAvatars[
            randomNumberFromSeed(
              0,
              anonymousAvatars.length - 1,
              randomSeedFromChat(chat)
            )
          ] ?? anonymousAvatars[0]
        ),
    partialPhoneNumber: identityRevealData.deanonymizedUser.partialPhoneNumber,
  }
}

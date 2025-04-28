import {type RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {type IdentityReveal} from '@vexl-next/domain/src/general/tradeChecklist'
import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import avatarsSvg from '../../../components/AnonymousAvatar/images/avatarsSvg'
import {randomSeedFromChat} from '../../../utils/RandomSeed'
import {randomNumberFromSeed} from '../../../utils/randomNumber'
import resolveLocalUri from '../../../utils/resolveLocalUri'

export default function processTradeChecklistIdentityRevealMessageIfAny(
  identityRevealData: IdentityReveal | undefined,
  chat: Chat
): RealLifeInfo | undefined {
  if (!identityRevealData?.deanonymizedUser?.name) return undefined

  return {
    userName: identityRevealData.deanonymizedUser.name,
    image: identityRevealData.image
      ? {
          type: 'imageUri',
          imageUri: resolveLocalUri(identityRevealData.image),
        }
      : {
          type: 'svgXml',
          svgXml: avatarsSvg[
            randomNumberFromSeed(
              0,
              avatarsSvg.length - 1,
              randomSeedFromChat(chat)
            )
          ] as SvgString,
        },
    partialPhoneNumber: identityRevealData.deanonymizedUser.partialPhoneNumber,
  }
}

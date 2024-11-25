import {type GoldenAvatarType} from '@vexl-next/domain/src/general/offers'
import {RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {fromSvgString} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import {getRandomAvatarSvgFromSeed} from '../../../components/AnonymousAvatar'
import randomName from '../../../utils/randomName'

// Should this be done based on the privatek key?
export function generateRandomUserData({
  seed,
  goldenAvatarType,
}: {
  seed: string
  goldenAvatarType?: GoldenAvatarType
}): RealLifeInfo {
  return RealLifeInfo.parse({
    image: fromSvgString(getRandomAvatarSvgFromSeed({seed, goldenAvatarType})),
    userName: randomName(),
  })
}

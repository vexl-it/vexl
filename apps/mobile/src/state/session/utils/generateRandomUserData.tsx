import {type GoldenAvatarType} from '@vexl-next/domain/src/general/offers'
import {RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {fromSvgString} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import {Schema} from 'effect'
import {type Session} from '../../../brands/Session.brand'
import avatarsGoldenSvg from '../../../components/AnonymousAvatar/images/avatarsGoldenGlassesAndBackgroundSvg'
import avatarsSvg from '../../../components/AnonymousAvatar/images/avatarsSvg'
import randomName from '../../../utils/randomName'
import {randomNumberFromSeed} from '../../../utils/randomNumber'
import {
  RandomSeed,
  type RandomSeed as RandomSeedType,
} from '../../../utils/RandomSeed'

function getRandomAvatarSvgFromSeed({
  seed,
  goldenAvatarType,
}: {
  seed: RandomSeedType
  goldenAvatarType?: GoldenAvatarType
}): SvgString {
  const avatars =
    goldenAvatarType === 'BACKGROUND_AND_GLASSES'
      ? avatarsGoldenSvg
      : avatarsSvg
  const index = randomNumberFromSeed(0, avatars.length - 1, seed)
  return avatars[index] ?? avatars[0]
}

// Should this be done based on the private key?
export function generateRandomUserInSessionData({
  session,
  goldenAvatarType,
}: {
  session: Session
  goldenAvatarType?: GoldenAvatarType
}): RealLifeInfo {
  return Schema.decodeSync(RealLifeInfo)({
    image: fromSvgString(
      getRandomAvatarSvgFromSeed({
        seed: Schema.decodeSync(RandomSeed)(
          session.privateKey.publicKeyPemBase64
        ),
        goldenAvatarType,
      })
    ),
    userName: randomName(),
  })
}

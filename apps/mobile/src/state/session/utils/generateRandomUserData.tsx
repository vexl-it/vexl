import {type GoldenAvatarType} from '@vexl-next/domain/src/general/offers'
import {RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {fromSvgString} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import {Schema} from 'effect'
import {type Session} from '../../../brands/Session.brand'
import {getRandomAvatarSvgFromSeed} from '../../../components/AnonymousAvatar'
import randomName from '../../../utils/randomName'
import {RandomSeed} from '../../../utils/RandomSeed'

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

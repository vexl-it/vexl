import {type GoldenAvatarType} from '@vexl-next/domain/src/general/offers'
import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {fromSvgString} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import {Schema} from 'effect'
import {getDefaultStore} from 'jotai'
import {type Session} from '../../../brands/Session.brand'
import goldenAvatarImages from '../../../components/AnonymousAvatar/images/avatarsGoldenGlassesAndBackgroundSvg'
import basicAvatarImages from '../../../components/AnonymousAvatar/images/avatarsSvg'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {randomNumberFromSeed} from '../../../utils/randomNumber'
import {RandomSeed} from '../../../utils/RandomSeed'

function getRandomAvatarSvgFromSeed({
  seed,
  goldenAvatarType,
}: {
  seed: typeof RandomSeed.Type
  goldenAvatarType?: GoldenAvatarType
}): SvgString {
  const avatars =
    goldenAvatarType === 'BACKGROUND_AND_GLASSES'
      ? goldenAvatarImages
      : basicAvatarImages
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
    userName: UserName.make(
      getDefaultStore().get(translationAtom).t('common.anonymous')
    ),
  })
}

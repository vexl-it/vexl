import {UserNameAndAvatar} from '@vexl-next/domain/dist/general/UserNameAndAvatar.brand'
import {fromSvgString} from '@vexl-next/domain/dist/utility/SvgStringOrImageUri.brand'
import randomName from '../../utils/randomName'
import {getRandomAvatarSvgFromSeed} from '../../components/AnonymousAvatar'

// Should this be done based on the privatek key?
export function generateRandomUserData(seed: string): UserNameAndAvatar {
  return UserNameAndAvatar.parse({
    image: fromSvgString(getRandomAvatarSvgFromSeed(seed)),
    userName: randomName(),
  })
}

import {type GoldenAvatarType} from '@vexl-next/domain/src/general/offers'
import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {type StyleProp, type ViewStyle} from 'react-native'
import {randomNumberFromSeed} from '../../utils/randomNumber'
import Image from '../Image'
import UserAvatar from '../UserAvatar'
import avatarsGoldenGlassesAndBackgroundSvg from './images/avatarsGoldenGlassesAndBackgroundSvg'
import avatarsSvg from './images/avatarsSvg'

interface Props {
  avatarIndex: number
  style?: StyleProp<ViewStyle>
}

function AnonymousAvatar({avatarIndex, style}: Props): JSX.Element {
  return (
    <Image
      source={avatarsSvg[avatarIndex] ?? avatarsSvg[0]}
      style={style}
    ></Image>
  )
}

export default AnonymousAvatar

export function getAvatarSvg({
  avatarIndex,
  goldenAvatarType,
}: {
  avatarIndex: number
  goldenAvatarType?: GoldenAvatarType
}): SvgString {
  if (goldenAvatarType === 'BACKGROUND_AND_GLASSES')
    return (
      avatarsGoldenGlassesAndBackgroundSvg[avatarIndex] ??
      avatarsGoldenGlassesAndBackgroundSvg[0]
    )
  return avatarsSvg[avatarIndex] ?? avatarsSvg[0]
}

export function getRandomAvatarSvgFromSeed({
  seed,
  goldenAvatarType,
}: {
  seed: string
  goldenAvatarType?: GoldenAvatarType
}): SvgString {
  const randomNumber = randomNumberFromSeed(
    0,
    goldenAvatarType === 'BACKGROUND_AND_GLASSES'
      ? avatarsGoldenGlassesAndBackgroundSvg.length - 1
      : avatarsSvg.length - 1,
    seed
  )
  return getAvatarSvg({avatarIndex: randomNumber, goldenAvatarType})
}

export function AnonymousAvatarFromSeed({
  seed,
  width,
  height,
  grayScale,
  goldenAvatarType,
}: {
  seed: string
  height: number
  width: number
  grayScale: boolean
  goldenAvatarType?: GoldenAvatarType
}): JSX.Element {
  const avatar =
    goldenAvatarType === 'BACKGROUND_AND_GLASSES'
      ? avatarsGoldenGlassesAndBackgroundSvg[
          randomNumberFromSeed(
            0,
            avatarsGoldenGlassesAndBackgroundSvg.length - 1,
            seed
          )
        ]
      : avatarsSvg[randomNumberFromSeed(0, avatarsSvg.length - 1, seed)]

  return (
    <UserAvatar
      userImage={{type: 'svgXml', svgXml: avatar ?? avatarsSvg[0]}}
      width={width}
      height={height}
      grayScale={grayScale}
    />
  )
}

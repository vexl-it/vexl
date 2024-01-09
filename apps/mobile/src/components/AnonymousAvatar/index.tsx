import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {type StyleProp, type ViewStyle} from 'react-native'
import {randomNumberFromSeed} from '../../utils/randomNumber'
import Image from '../Image'
import UserAvatar from '../UserAvatar'
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

export function getAvatarSvg(avatarIndex: number): SvgString {
  return avatarsSvg[avatarIndex] ?? avatarsSvg[0]
}

export function getRandomAvatarSvgFromSeed(seed: string): SvgString {
  const randomNumber = randomNumberFromSeed(0, avatarsSvg.length - 1, seed)
  return getAvatarSvg(randomNumber)
}

export function AnonymousAvatarFromSeed({
  seed,
  width,
  height,
  grayScale,
}: {
  seed: string
  height: number
  width: number
  grayScale: boolean
}): JSX.Element {
  const avatar =
    avatarsSvg[randomNumberFromSeed(0, avatarsSvg.length - 1, seed)] ??
    avatarsSvg[0]

  return (
    <UserAvatar
      userImage={{type: 'svgXml', svgXml: avatar}}
      width={width}
      height={height}
      grayScale={grayScale}
    />
  )
}

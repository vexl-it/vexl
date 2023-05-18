import {type StyleProp, type ViewStyle} from 'react-native'
import Image from '../Image'
import avatarsSvg from './images/avatarsSvg'
import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import {randomNumberFromSeed} from '../../utils/randomNumber'
import UserAvatar from '../UserAvatar'

interface Props {
  avatarIndex: number
  style?: StyleProp<ViewStyle>
}

function AnonymousAvatar({avatarIndex, style}: Props): JSX.Element {
  return <Image source={avatarsSvg[avatarIndex]} style={style}></Image>
}

export default AnonymousAvatar

export function getAvatarSvg(avatarIndex: number): SvgString {
  return avatarsSvg[avatarIndex]
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
    avatarsSvg[randomNumberFromSeed(0, avatarsSvg.length - 1, seed)]

  return (
    <UserAvatar
      userImage={{type: 'svgXml', svgXml: avatar}}
      width={width}
      height={height}
      grayScale={grayScale}
    />
  )
}

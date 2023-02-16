import {type StyleProp, type ViewStyle} from 'react-native'
import Image from '../Image'
import avatarsSvg from './images/avatarsSvg'
import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'

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

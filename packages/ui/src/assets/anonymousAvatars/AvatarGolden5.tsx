import React from 'react'
import Svg, {
  ClipPath,
  Defs,
  FeColorMatrix,
  Filter,
  G,
  LinearGradient,
  Mask,
  Path,
  Rect,
  Stop,
} from 'react-native-svg'

interface Props {
  readonly size?: number
  readonly grayscale?: boolean
}

export function AvatarGolden5({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_664)"><Rect width="150" height="150" rx="20" fill="url(#paint0_linear_115_664)" /><G style={{mixBlendMode: 'soft-light'}}><Rect width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><Rect width="150" height="150" rx="20" fill="url(#paint1_linear_115_664)" /><G style={{mixBlendMode: 'soft-light'}}><Rect width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><G clipPath="url(#clip1_115_664)"><Mask id="mask0_115_664" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 15H15V135H135V15Z" fill="white" /></Mask><G mask="url(#mask0_115_664)"><Mask id="mask1_115_664" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="27" y="63" width="96" height="48"><Path d="M27.0001 111L123 111V63L27.0001 63V111Z" fill="white" /></Mask><G mask="url(#mask1_115_664)"><Path d="M27 63.0003C27 63.0003 48.4903 63.0003 74.9999 63.0003C101.51 63.0003 123 63.0003 123 63.0003C123 89.5099 101.51 111 74.9999 111C48.4903 111 27 89.5099 27 63.0003Z" fill="black" /><Path d="M27 63.0003C27 63.0003 48.4903 63.0003 74.9999 63.0003C101.51 63.0003 123 63.0003 123 63.0003C123 89.5099 101.51 111 74.9999 111C48.4903 111 27 89.5099 27 63.0003Z" fill="black" fillOpacity="0.2" /></G><Path d="M111.12 134.981H38.917L75.0186 98.8799L111.12 134.981Z" fill="black" /><Path d="M111.12 134.981H38.917L75.0186 98.8799L111.12 134.981Z" fill="black" fillOpacity="0.2" /><Path d="M50.9336 38.9628H99.0989L75.0163 63.0454L50.9336 38.9628Z" fill="black" /><Path d="M50.9336 38.9628H99.0989L75.0163 63.0454L50.9336 38.9628Z" fill="black" fillOpacity="0.2" /><Path d="M75 45.2401C81.6274 45.2401 87 39.8675 87 33.2401C87 26.6127 81.6274 21.2401 75 21.2401C68.3726 21.2401 63 26.6127 63 33.2401C63 39.8675 68.3726 45.2401 75 45.2401Z" fill="black" /><Path d="M75 45.2401C81.6274 45.2401 87 39.8675 87 33.2401C87 26.6127 81.6274 21.2401 75 21.2401C68.3726 21.2401 63 26.6127 63 33.2401C63 39.8675 68.3726 45.2401 75 45.2401Z" fill="black" fillOpacity="0.2" /></G><G clipPath="url(#clip2_115_664)"><Path d="M42 72.6702H108.776V77.4326H42V72.6702Z" fill="#DB921E" /><Path d="M69.6212 85.5389C69.6212 85.5389 64.967 80.8779 59.2 75.1022C53.4329 69.3264 48.7788 64.6654 48.7788 64.6654C54.5459 58.8897 63.9553 58.8897 69.7223 64.6654C75.3882 70.3398 75.3882 79.7632 69.6212 85.5389Z" fill="#FFD700" /><Path d="M69.6211 85.5386C63.854 91.3144 54.4446 91.3144 48.6776 85.5386C42.9105 79.7629 42.9105 70.3395 48.6776 64.5638C48.6776 64.5638 53.3317 69.2249 59.0988 75.0005C64.967 80.7763 69.6211 85.5386 69.6211 85.5386Z" fill="#DBA21E" /><Path d="M102.098 85.5389C102.098 85.5389 97.4443 80.8779 91.6773 75.1022C85.9102 69.3264 81.2561 64.6654 81.2561 64.6654C87.0232 58.8897 96.4326 58.8897 102.2 64.6654C107.866 70.3398 107.866 79.7632 102.098 85.5389Z" fill="#FFD700" /><Path d="M102.098 85.5386C96.3314 91.3144 86.9219 91.3144 81.1549 85.5386C75.3878 79.7629 75.3878 70.3395 81.1549 64.5638C81.1549 64.5638 85.809 69.2249 91.5761 75.0005C97.4443 80.7763 102.098 85.5386 102.098 85.5386Z" fill="#DBA21E" /><Path d="M73.365 69.5L98.6591 65.4259L101.694 42L104.73 65.4259L128 68.4815L104.73 71.537L101.694 97L98.6591 71.537L73.365 69.5Z" fill="white" /></G></G></G><Defs><LinearGradient id="paint0_linear_115_664" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><LinearGradient id="paint1_linear_115_664" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_664"><Rect width="150" height="150" rx="20" fill="white" /></ClipPath><ClipPath id="clip1_115_664"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath><ClipPath id="clip2_115_664"><Rect width="86" height="55" fill="white" transform="translate(42 42)" /></ClipPath></Defs></G></Svg>)
}

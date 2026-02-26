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

export function AvatarGolden14({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_684)"><Rect width="150" height="150" rx="20" fill="url(#paint0_linear_115_684)" /><G style={{mixBlendMode: 'soft-light'}}><Rect width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><Mask id="mask0_115_684" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 135H15V15H135V135Z" fill="white" /></Mask><G mask="url(#mask0_115_684)"><Mask id="mask1_115_684" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="27" y="39" width="96" height="48"><Path d="M27.0001 39L123 39V87L27.0001 87V39Z" fill="white" /></Mask><G mask="url(#mask1_115_684)"><Path d="M27.0001 86.9997C27.0001 86.9997 48.4904 86.9997 75 86.9997C101.51 86.9997 123 86.9997 123 86.9997C123 60.4901 101.51 38.9998 75 38.9998C48.4904 38.9998 27.0001 60.4901 27.0001 86.9997Z" fill="black" /><Path d="M27.0001 86.9997C27.0001 86.9997 48.4904 86.9997 75 86.9997C101.51 86.9997 123 86.9997 123 86.9997C123 60.4901 101.51 38.9998 75 38.9998C48.4904 38.9998 27.0001 60.4901 27.0001 86.9997Z" fill="black" fillOpacity="0.2" /></G><Path d="M111.12 15.019H38.917L75.0186 51.1201L111.12 15.019Z" fill="black" /><Path d="M111.12 15.019H38.917L75.0186 51.1201L111.12 15.019Z" fill="black" fillOpacity="0.2" /><Path d="M50.9336 111.037H99.0989L75.0163 86.9546L50.9336 111.037Z" fill="black" /><Path d="M50.9336 111.037H99.0989L75.0163 86.9546L50.9336 111.037Z" fill="black" fillOpacity="0.2" /><Path d="M75 104.76C81.6274 104.76 87 110.132 87 116.76C87 123.387 81.6274 128.76 75 128.76C68.3726 128.76 63 123.387 63 116.76C63 110.132 68.3726 104.76 75 104.76Z" fill="black" /><Path d="M75 104.76C81.6274 104.76 87 110.132 87 116.76C87 123.387 81.6274 128.76 75 128.76C68.3726 128.76 63 123.387 63 116.76C63 110.132 68.3726 104.76 75 104.76Z" fill="black" fillOpacity="0.2" /></G><G clipPath="url(#clip1_115_684)"><Path d="M41 72.6702H107.776V77.4326H41V72.6702Z" fill="#DB921E" /><Path d="M68.6212 85.5389C68.6212 85.5389 63.967 80.8779 58.2 75.1022C52.4329 69.3264 47.7788 64.6654 47.7788 64.6654C53.5459 58.8897 62.9553 58.8897 68.7223 64.6654C74.3882 70.3398 74.3882 79.7632 68.6212 85.5389Z" fill="#FFD700" /><Path d="M68.6212 85.5386C62.8542 91.3144 53.4448 91.3144 47.6777 85.5386C41.9107 79.7629 41.9107 70.3395 47.6777 64.5638C47.6777 64.5638 52.3318 69.2249 58.0989 75.0005C63.9671 80.7763 68.6212 85.5386 68.6212 85.5386Z" fill="#DBA21E" /><Path d="M101.098 85.5389C101.098 85.5389 96.4443 80.8779 90.6773 75.1022C84.9102 69.3264 80.2561 64.6654 80.2561 64.6654C86.0232 58.8897 95.4326 58.8897 101.2 64.6654C106.866 70.3398 106.866 79.7632 101.098 85.5389Z" fill="#FFD700" /><Path d="M101.098 85.5386C95.3314 91.3144 85.9219 91.3144 80.1549 85.5386C74.3878 79.7629 74.3878 70.3395 80.1549 64.5638C80.1549 64.5638 84.809 69.2249 90.5761 75.0005C96.4443 80.7763 101.098 85.5386 101.098 85.5386Z" fill="#DBA21E" /><Path d="M72.3649 69.5L97.659 65.4259L100.694 42L103.73 65.4259L127 68.4815L103.73 71.537L100.694 97L97.659 71.537L72.3649 69.5Z" fill="white" /></G></G><Defs><LinearGradient id="paint0_linear_115_684" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_684"><Rect width="150" height="150" rx="20" fill="white" /></ClipPath><ClipPath id="clip1_115_684"><Rect width="86" height="55" fill="white" transform="translate(41 42)" /></ClipPath></Defs></G></Svg>)
}

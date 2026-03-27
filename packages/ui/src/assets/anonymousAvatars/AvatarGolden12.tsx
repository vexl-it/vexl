/* eslint-disable @typescript-eslint/no-deprecated */
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

export function AvatarGolden12({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_1421)"><Rect width="150" height="150" rx="20" fill="url(#paint0_linear_115_1421)" /><G style={{mixBlendMode: 'soft-light'}}><Rect width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><G clipPath="url(#clip1_115_1421)"><Mask id="mask0_115_1421" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 15H15V135H135V15Z" fill="white" /></Mask><G mask="url(#mask0_115_1421)"><Path d="M15 75L75 15V75H15Z" fill="black" /><Path d="M75 15L111 51H75V15Z" fill="black" /><Path d="M75 51H123V75C123 88.2548 112.255 99 99 99H75V51Z" fill="black" /><G clipPath="url(#clip2_115_1421)"><Path d="M41 72.6702H107.776V77.4326H41V72.6702Z" fill="#DB921E" /><Path d="M68.6212 85.539C68.6212 85.539 63.967 80.878 58.2 75.1023C52.4329 69.3266 47.7788 64.6655 47.7788 64.6655C53.5459 58.8898 62.9553 58.8898 68.7223 64.6655C74.3882 70.3399 74.3882 79.7633 68.6212 85.539Z" fill="#FFD700" /><Path d="M68.6211 85.5386C62.854 91.3143 53.4446 91.3143 47.6776 85.5386C41.9105 79.7629 41.9105 70.3394 47.6776 64.5637C47.6776 64.5637 52.3317 69.2249 58.0988 75.0005C63.967 80.7762 68.6211 85.5386 68.6211 85.5386Z" fill="#DBA21E" /><Path d="M101.098 85.539C101.098 85.539 96.4443 80.878 90.6773 75.1023C84.9102 69.3266 80.2561 64.6655 80.2561 64.6655C86.0232 58.8898 95.4326 58.8898 101.2 64.6655C106.866 70.3399 106.866 79.7633 101.098 85.539Z" fill="#FFD700" /><Path d="M101.098 85.5386C95.3314 91.3143 85.9219 91.3143 80.1549 85.5386C74.3878 79.7629 74.3878 70.3394 80.1549 64.5637C80.1549 64.5637 84.809 69.2249 90.5761 75.0005C96.4443 80.7762 101.098 85.5386 101.098 85.5386Z" fill="#DBA21E" /><Path d="M72.365 69.5L97.6591 65.4259L100.694 42L103.73 65.4259L127 68.4815L103.73 71.537L100.694 97L97.6591 71.537L72.365 69.5Z" fill="white" /></G><Path d="M75 98.9999C68.3368 98.9999 51 98.9999 51 98.9999C51 87.0706 51 77.3999 75 77.3999V98.9999Z" fill="black" /><Path d="M75 135C81.6632 135 99 135 99 135C99 115.118 99 99 75 99V135Z" fill="black" /><Path d="M75 135C68.3368 135 51 135 51 135C51 115.118 51 99 75 99V135Z" fill="black" /></G></G></G><Defs><LinearGradient id="paint0_linear_115_1421" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_1421"><Rect width="150" height="150" rx="20" fill="white" /></ClipPath><ClipPath id="clip1_115_1421"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath><ClipPath id="clip2_115_1421"><Rect width="86" height="55" fill="white" transform="translate(41 42)" /></ClipPath></Defs></G></Svg>)
}

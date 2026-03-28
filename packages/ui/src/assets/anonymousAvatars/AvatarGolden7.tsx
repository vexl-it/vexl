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

export function AvatarGolden7({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_1131)"><Rect width="150" height="150" rx="20" fill="url(#paint0_linear_115_1131)" /><G style={{mixBlendMode: 'soft-light'}}><Rect width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><G clipPath="url(#clip1_115_1131)"><Mask id="mask0_115_1131" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 15H15V135H135V15Z" fill="white" /></Mask><G mask="url(#mask0_115_1131)"><Path d="M53.3999 135H86.9999V101.4L53.3999 135Z" fill="black" /><Path d="M53.3999 135H86.9999V101.4L53.3999 135Z" fill="black" fillOpacity="0.2" /><Path d="M90.6001 101.52C105.247 101.52 117.12 89.6466 117.12 75C117.12 60.3534 105.247 48.48 90.6001 48.48C75.9535 48.48 64.0801 60.3534 64.0801 75C64.0801 89.6466 75.9535 101.52 90.6001 101.52Z" fill="black" /><Path d="M90.6001 101.52C105.247 101.52 117.12 89.6466 117.12 75C117.12 60.3534 105.247 48.48 90.6001 48.48C75.9535 48.48 64.0801 60.3534 64.0801 75C64.0801 89.6466 75.9535 101.52 90.6001 101.52Z" fill="black" fillOpacity="0.2" /><Path d="M50.3399 102.96C63.5616 102.96 74.2799 92.2418 74.2799 79.0201C74.2799 65.7984 63.5616 55.0801 50.3399 55.0801C37.1182 55.0801 26.3999 65.7984 26.3999 79.0201C26.3999 92.2418 37.1182 102.96 50.3399 102.96Z" fill="black" /><Path d="M50.3399 102.96C63.5616 102.96 74.2799 92.2418 74.2799 79.0201C74.2799 65.7984 63.5616 55.0801 50.3399 55.0801C37.1182 55.0801 26.3999 65.7984 26.3999 79.0201C26.3999 92.2418 37.1182 102.96 50.3399 102.96Z" fill="black" fillOpacity="0.2" /><Path d="M87 57.96C73.7452 57.96 63 47.2148 63 33.96H87C100.255 33.96 111 44.7051 111 57.96H87Z" fill="black" /><Path d="M87 57.96C73.7452 57.96 63 47.2148 63 33.96H87C100.255 33.96 111 44.7051 111 57.96H87Z" fill="black" fillOpacity="0.2" /><Path d="M63 51C76.2548 51 87 40.2548 87 27H63C49.7452 27 39 37.7452 39 51H63Z" fill="black" /><Path d="M63 51C76.2548 51 87 40.2548 87 27H63C49.7452 27 39 37.7452 39 51H63Z" fill="black" fillOpacity="0.2" /><G clipPath="url(#clip2_115_1131)"><Path d="M42 72.6702H108.776V77.4326H42V72.6702Z" fill="#DB921E" /><Path d="M69.6212 85.539C69.6212 85.539 64.967 80.878 59.2 75.1023C53.4329 69.3266 48.7788 64.6655 48.7788 64.6655C54.5459 58.8898 63.9553 58.8898 69.7223 64.6655C75.3882 70.3399 75.3882 79.7633 69.6212 85.539Z" fill="#FFD700" /><Path d="M69.6211 85.5386C63.854 91.3143 54.4446 91.3143 48.6776 85.5386C42.9105 79.7629 42.9105 70.3394 48.6776 64.5637C48.6776 64.5637 53.3317 69.2249 59.0988 75.0005C64.967 80.7762 69.6211 85.5386 69.6211 85.5386Z" fill="#DBA21E" /><Path d="M102.098 85.539C102.098 85.539 97.4443 80.878 91.6773 75.1023C85.9102 69.3266 81.2561 64.6655 81.2561 64.6655C87.0232 58.8898 96.4326 58.8898 102.2 64.6655C107.866 70.3399 107.866 79.7633 102.098 85.539Z" fill="#FFD700" /><Path d="M102.098 85.5386C96.3314 91.3143 86.9219 91.3143 81.1549 85.5386C75.3878 79.7629 75.3878 70.3394 81.1549 64.5637C81.1549 64.5637 85.809 69.2249 91.5761 75.0005C97.4443 80.7762 102.098 85.5386 102.098 85.5386Z" fill="#DBA21E" /><Path d="M73.365 69.5L98.6591 65.4259L101.694 42L104.73 65.4259L128 68.4815L104.73 71.537L101.694 97L98.6591 71.537L73.365 69.5Z" fill="white" /></G><Path d="M77.4001 75C77.4001 75 77.4001 83.0589 77.4001 93C77.4001 102.941 77.4001 111 77.4001 111C68.1217 111 60.6001 102.941 60.6001 93C60.6001 83.0589 68.1217 75 77.4001 75Z" fill="black" /><Path d="M77.4001 75C77.4001 75 77.4001 83.0589 77.4001 93C77.4001 102.941 77.4001 111 77.4001 111C68.1217 111 60.6001 102.941 60.6001 93C60.6001 83.0589 68.1217 75 77.4001 75Z" fill="black" fillOpacity="0.2" /></G></G></G><Defs><LinearGradient id="paint0_linear_115_1131" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_1131"><Rect width="150" height="150" rx="20" fill="white" /></ClipPath><ClipPath id="clip1_115_1131"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath><ClipPath id="clip2_115_1131"><Rect width="86" height="55" fill="white" transform="translate(42 42)" /></ClipPath></Defs></G></Svg>)
}

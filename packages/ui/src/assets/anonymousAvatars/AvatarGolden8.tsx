/* eslint-disable @typescript-eslint/no-deprecated */
import React from 'react'
import Svg, {
  ClipPath,
  Defs,
  FeColorMatrix,
  Filter,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg'

interface Props {
  readonly size?: number
  readonly grayscale?: boolean
}

export function AvatarGolden8({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_1193)"><Rect x="2" width="150" height="150" rx="20" fill="url(#paint0_linear_115_1193)" /><G style={{mixBlendMode: 'soft-light'}}><Rect x="2" width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><Path d="M111 94.9202H39V22.9202L111 94.9202Z" fill="black" /><Path d="M111 94.9202H39V22.9202L111 94.9202Z" fill="black" fillOpacity="0.2" /><Path d="M99 27.0002C112.255 27.0002 123 37.7454 123 51.0002H99C85.7452 51.0002 75 40.2551 75 27.0002H99Z" fill="black" /><Path d="M99 27.0002C112.255 27.0002 123 37.7454 123 51.0002H99C85.7452 51.0002 75 40.2551 75 27.0002H99Z" fill="black" fillOpacity="0.2" /><Path d="M78.84 94.9201H39V55.0801L78.84 94.9201Z" fill="black" /><Path d="M78.84 94.9201H39V55.0801L78.84 94.9201Z" fill="black" fillOpacity="0.2" /><Path d="M55.08 94.9202C70.5882 94.9202 83.16 107.492 83.16 123H55.08C39.5718 123 27 110.428 27 94.9202H55.08Z" fill="black" /><Path d="M55.08 94.9202C70.5882 94.9202 83.16 107.492 83.16 123H55.08C39.5718 123 27 110.428 27 94.9202H55.08Z" fill="black" fillOpacity="0.2" /><Path d="M111 94.9202L67.0801 51.0002H111V94.9202Z" fill="black" /><Path d="M111 94.9202L67.0801 51.0002H111V94.9202Z" fill="black" fillOpacity="0.2" /><G clipPath="url(#clip1_115_1193)"><Path d="M42 72.6702H108.776V77.4326H42V72.6702Z" fill="#DB921E" /><Path d="M69.6212 85.539C69.6212 85.539 64.967 80.878 59.2 75.1023C53.4329 69.3266 48.7788 64.6655 48.7788 64.6655C54.5459 58.8898 63.9553 58.8898 69.7223 64.6655C75.3882 70.3399 75.3882 79.7633 69.6212 85.539Z" fill="#FFD700" /><Path d="M69.6211 85.5386C63.854 91.3143 54.4446 91.3143 48.6776 85.5386C42.9105 79.7629 42.9105 70.3394 48.6776 64.5637C48.6776 64.5637 53.3317 69.2249 59.0988 75.0005C64.967 80.7762 69.6211 85.5386 69.6211 85.5386Z" fill="#DBA21E" /><Path d="M102.098 85.539C102.098 85.539 97.4443 80.878 91.6773 75.1023C85.9102 69.3266 81.2561 64.6655 81.2561 64.6655C87.0232 58.8898 96.4326 58.8898 102.2 64.6655C107.866 70.3399 107.866 79.7633 102.098 85.539Z" fill="#FFD700" /><Path d="M102.098 85.5386C96.3314 91.3143 86.9219 91.3143 81.1549 85.5386C75.3878 79.7629 75.3878 70.3394 81.1549 64.5637C81.1549 64.5637 85.809 69.2249 91.5761 75.0005C97.4443 80.7762 102.098 85.5386 102.098 85.5386Z" fill="#DBA21E" /><Path d="M73.365 69.5L98.6591 65.4259L101.694 42L104.73 65.4259L128 68.4815L104.73 71.537L101.694 97L98.6591 71.537L73.365 69.5Z" fill="white" /></G></G><Defs><LinearGradient id="paint0_linear_115_1193" x1="2" y1="0" x2="152" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_1193"><Rect width="150" height="150" rx="20" fill="white" /></ClipPath><ClipPath id="clip1_115_1193"><Rect width="86" height="55" fill="white" transform="translate(42 42)" /></ClipPath></Defs></G></Svg>)
}

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

export function AvatarGolden19({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_1214)"><Rect width="150" height="150" rx="20" fill="url(#paint0_linear_115_1214)" /><G style={{mixBlendMode: 'soft-light'}}><Rect width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><Path d="M111 55.0798H39V127.08L111 55.0798Z" fill="black" /><Path d="M111 55.0798H39V127.08L111 55.0798Z" fill="black" fillOpacity="0.2" /><Path d="M99 123C112.255 123 123 112.255 123 98.9998H99C85.7452 98.9998 75 109.745 75 123H99Z" fill="black" /><Path d="M99 123C112.255 123 123 112.255 123 98.9998H99C85.7452 98.9998 75 109.745 75 123H99Z" fill="black" fillOpacity="0.2" /><Path d="M78.8401 55.0799H39.0001V94.9199L78.8401 55.0799Z" fill="black" /><Path d="M78.8401 55.0799H39.0001V94.9199L78.8401 55.0799Z" fill="black" fillOpacity="0.2" /><Path d="M55.0799 55.0798C70.5881 55.0798 83.1599 42.508 83.1599 27H55.0799C39.5717 27 26.9999 39.5717 26.9999 55.0798H55.0799Z" fill="black" /><Path d="M55.0799 55.0798C70.5881 55.0798 83.1599 42.508 83.1599 27H55.0799C39.5717 27 26.9999 39.5717 26.9999 55.0798H55.0799Z" fill="black" fillOpacity="0.2" /><Path d="M111 55.0798L67.08 98.9998H111V55.0798Z" fill="black" /><Path d="M111 55.0798L67.08 98.9998H111V55.0798Z" fill="black" fillOpacity="0.2" /><G clipPath="url(#clip1_115_1214)"><Path d="M42 71.6702H108.776V76.4326H42V71.6702Z" fill="#DB921E" /><Path d="M69.6212 84.539C69.6212 84.539 64.967 79.878 59.2 74.1023C53.4329 68.3266 48.7788 63.6655 48.7788 63.6655C54.5459 57.8898 63.9553 57.8898 69.7223 63.6655C75.3882 69.3399 75.3882 78.7633 69.6212 84.539Z" fill="#FFD700" /><Path d="M69.6212 84.5386C63.8542 90.3143 54.4448 90.3143 48.6777 84.5386C42.9107 78.7629 42.9107 69.3394 48.6777 63.5637C48.6777 63.5637 53.3318 68.2249 59.0989 74.0005C64.9671 79.7762 69.6212 84.5386 69.6212 84.5386Z" fill="#DBA21E" /><Path d="M102.098 84.539C102.098 84.539 97.4443 79.878 91.6773 74.1023C85.9102 68.3266 81.2561 63.6655 81.2561 63.6655C87.0232 57.8898 96.4326 57.8898 102.2 63.6655C107.866 69.3399 107.866 78.7633 102.098 84.539Z" fill="#FFD700" /><Path d="M102.098 84.5386C96.3314 90.3143 86.9219 90.3143 81.1549 84.5386C75.3878 78.7629 75.3878 69.3394 81.1549 63.5637C81.1549 63.5637 85.809 68.2249 91.5761 74.0005C97.4443 79.7762 102.098 84.5386 102.098 84.5386Z" fill="#DBA21E" /><Path d="M73.3649 68.5L98.659 64.4259L101.694 41L104.73 64.4259L128 67.4815L104.73 70.537L101.694 96L98.659 70.537L73.3649 68.5Z" fill="white" /></G></G><Defs><LinearGradient id="paint0_linear_115_1214" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_1214"><Rect width="150" height="150" rx="20" fill="white" /></ClipPath><ClipPath id="clip1_115_1214"><Rect width="86" height="55" fill="white" transform="translate(42 41)" /></ClipPath></Defs></G></Svg>)
}

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

export function AvatarGolden24({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_1506)"><Rect width="150" height="150" rx="20" fill="url(#paint0_linear_115_1506)" /><G style={{mixBlendMode: 'soft-light'}}><Rect width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><Path d="M115.2 51L67.1999 99H115.2V51Z" fill="black" /><Path d="M115.2 51L67.1999 99H115.2V51Z" fill="black" fillOpacity="0.2" /><Path d="M34.68 99.12L82.7999 51H34.68V99.12Z" fill="black" /><Path d="M34.68 99.12L82.7999 51H34.68V99.12Z" fill="black" fillOpacity="0.2" /><Path d="M99 123C112.255 123 123 112.255 123 99H99C85.7452 99 75 109.745 75 123H99Z" fill="black" /><Path d="M99 123C112.255 123 123 112.255 123 99H99C85.7452 99 75 109.745 75 123H99Z" fill="black" fillOpacity="0.2" /><Path d="M51.12 123C37.8652 123 27.12 112.255 27.12 99H51.12C64.3748 99 75.12 109.745 75.12 123H51.12Z" fill="black" /><Path d="M51.12 123C37.8652 123 27.12 112.255 27.12 99H51.12C64.3748 99 75.12 109.745 75.12 123H51.12Z" fill="black" fillOpacity="0.2" /><Path d="M51.12 27.1201C37.8652 27.1201 27.12 37.8653 27.12 51.1201H51.12C64.3748 51.1201 75.12 40.3749 75.12 27.1201H51.12Z" fill="black" /><Path d="M51.12 27.1201C37.8652 27.1201 27.12 37.8653 27.12 51.1201H51.12C64.3748 51.1201 75.12 40.3749 75.12 27.1201H51.12Z" fill="black" fillOpacity="0.2" /><Path d="M99 27C112.255 27 123 37.7452 123 51H99C85.7452 51 75 40.2548 75 27H99Z" fill="black" /><Path d="M99 27C112.255 27 123 37.7452 123 51H99C85.7452 51 75 40.2548 75 27H99Z" fill="black" fillOpacity="0.2" /><G clipPath="url(#clip1_115_1506)"><Path d="M42 71.6699H108.776V76.4323H42V71.6699Z" fill="#DB921E" /><Path d="M69.6212 84.5388C69.6212 84.5388 64.967 79.8778 59.2 74.102C53.4329 68.3263 48.7788 63.6653 48.7788 63.6653C54.5459 57.8896 63.9553 57.8896 69.7223 63.6653C75.3882 69.3397 75.3882 78.7631 69.6212 84.5388Z" fill="#FFD700" /><Path d="M69.6212 84.5388C63.8542 90.3145 54.4448 90.3145 48.6777 84.5388C42.9107 78.7631 42.9107 69.3397 48.6777 63.564C48.6777 63.564 53.3318 68.2251 59.0989 74.0007C64.9671 79.7764 69.6212 84.5388 69.6212 84.5388Z" fill="#DBA21E" /><Path d="M102.098 84.5388C102.098 84.5388 97.4443 79.8778 91.6773 74.102C85.9102 68.3263 81.2561 63.6653 81.2561 63.6653C87.0232 57.8896 96.4326 57.8896 102.2 63.6653C107.866 69.3397 107.866 78.7631 102.098 84.5388Z" fill="#FFD700" /><Path d="M102.098 84.5388C96.3314 90.3145 86.9219 90.3145 81.1549 84.5388C75.3878 78.7631 75.3878 69.3397 81.1549 63.564C81.1549 63.564 85.809 68.2251 91.5761 74.0007C97.4443 79.7764 102.098 84.5388 102.098 84.5388Z" fill="#DBA21E" /><Path d="M73.3649 68.5L98.659 64.4259L101.694 41L104.73 64.4259L128 67.4815L104.73 70.537L101.694 96L98.659 70.537L73.3649 68.5Z" fill="white" /></G></G><Defs><LinearGradient id="paint0_linear_115_1506" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_1506"><Rect width="150" height="150" rx="20" fill="white" /></ClipPath><ClipPath id="clip1_115_1506"><Rect width="86" height="55" fill="white" transform="translate(42 41)" /></ClipPath></Defs></G></Svg>)
}

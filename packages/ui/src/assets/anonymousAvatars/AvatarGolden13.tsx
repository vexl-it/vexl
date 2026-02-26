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

export function AvatarGolden13({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_1483)"><Rect width="150" height="150" rx="20" fill="url(#paint0_linear_115_1483)" /><G style={{mixBlendMode: 'soft-light'}}><Rect width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><Path d="M34.8 51L82.8001 99H34.8V51Z" fill="black" /><Path d="M34.8 51L82.8001 99H34.8V51Z" fill="black" fillOpacity="0.2" /><Path d="M115.32 99.12L67.2002 51H115.32V99.12Z" fill="black" /><Path d="M115.32 99.12L67.2002 51H115.32V99.12Z" fill="black" fillOpacity="0.2" /><Path d="M51 123C37.7452 123 27 112.255 27 99H51C64.2548 99 75 109.745 75 123H51Z" fill="black" /><Path d="M51 123C37.7452 123 27 112.255 27 99H51C64.2548 99 75 109.745 75 123H51Z" fill="black" fillOpacity="0.2" /><Path d="M98.8799 123C112.135 123 122.88 112.255 122.88 99H98.8799C85.6251 99 74.8799 109.745 74.8799 123H98.8799Z" fill="black" /><Path d="M98.8799 123C112.135 123 122.88 112.255 122.88 99H98.8799C85.6251 99 74.8799 109.745 74.8799 123H98.8799Z" fill="black" fillOpacity="0.2" /><Path d="M98.8799 27.1201C112.135 27.1201 122.88 37.8653 122.88 51.1201H98.8799C85.6251 51.1201 74.8799 40.3749 74.8799 27.1201H98.8799Z" fill="black" /><Path d="M98.8799 27.1201C112.135 27.1201 122.88 37.8653 122.88 51.1201H98.8799C85.6251 51.1201 74.8799 40.3749 74.8799 27.1201H98.8799Z" fill="black" fillOpacity="0.2" /><Path d="M51 27C37.7452 27 27 37.7452 27 51H51C64.2548 51 75 40.2548 75 27H51Z" fill="black" /><Path d="M51 27C37.7452 27 27 37.7452 27 51H51C64.2548 51 75 40.2548 75 27H51Z" fill="black" fillOpacity="0.2" /><G clipPath="url(#clip1_115_1483)"><Path d="M42 72.6699H108.776V77.4323H42V72.6699Z" fill="#DB921E" /><Path d="M69.6212 85.5388C69.6212 85.5388 64.967 80.8778 59.2 75.102C53.4329 69.3263 48.7788 64.6653 48.7788 64.6653C54.5459 58.8896 63.9553 58.8896 69.7223 64.6653C75.3882 70.3397 75.3882 79.7631 69.6212 85.5388Z" fill="#FFD700" /><Path d="M69.6211 85.5388C63.854 91.3145 54.4446 91.3145 48.6776 85.5388C42.9105 79.7631 42.9105 70.3397 48.6776 64.564C48.6776 64.564 53.3317 69.2251 59.0988 75.0007C64.967 80.7764 69.6211 85.5388 69.6211 85.5388Z" fill="#DBA21E" /><Path d="M102.098 85.5388C102.098 85.5388 97.4443 80.8778 91.6773 75.102C85.9102 69.3263 81.2561 64.6653 81.2561 64.6653C87.0232 58.8896 96.4326 58.8896 102.2 64.6653C107.866 70.3397 107.866 79.7631 102.098 85.5388Z" fill="#FFD700" /><Path d="M102.098 85.5388C96.3314 91.3145 86.9219 91.3145 81.1549 85.5388C75.3878 79.7631 75.3878 70.3397 81.1549 64.564C81.1549 64.564 85.809 69.2251 91.5761 75.0007C97.4443 80.7764 102.098 85.5388 102.098 85.5388Z" fill="#DBA21E" /><Path d="M73.365 69.5L98.6591 65.4259L101.694 42L104.73 65.4259L128 68.4815L104.73 71.537L101.694 97L98.6591 71.537L73.365 69.5Z" fill="white" /></G></G><Defs><LinearGradient id="paint0_linear_115_1483" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_1483"><Rect width="150" height="150" rx="20" fill="white" /></ClipPath><ClipPath id="clip1_115_1483"><Rect width="86" height="55" fill="white" transform="translate(42 42)" /></ClipPath></Defs></G></Svg>)
}

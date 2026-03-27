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

export function AvatarGolden26({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_1632)"><Rect width="150" height="150" rx="20" fill="url(#paint0_linear_115_1632)" /><G style={{mixBlendMode: 'soft-light'}}><Rect width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><G clipPath="url(#clip1_115_1632)"><Mask id="mask0_115_1632" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 135H15V15H135V135Z" fill="white" /></Mask><G mask="url(#mask0_115_1632)"><Path d="M27 74.8799L74.88 27H27V74.8799Z" fill="black" /><Path d="M27 74.8799L74.88 27H27V74.8799Z" fill="black" fillOpacity="0.2" /><Path d="M123 74.8799L75.12 27H123V74.8799Z" fill="black" /><Path d="M123 74.8799L75.12 27H123V74.8799Z" fill="black" fillOpacity="0.2" /><Path d="M107.14 107.675C100.546 96.2536 85.9411 92.3402 74.5195 98.9345L86.5195 119.719C93.1138 131.141 107.719 135.054 119.14 128.46L107.14 107.675Z" fill="black" /><Path d="M107.14 107.675C100.546 96.2536 85.9411 92.3402 74.5195 98.9345L86.5195 119.719C93.1138 131.141 107.719 135.054 119.14 128.46L107.14 107.675Z" fill="black" fillOpacity="0.2" /><Path d="M42.36 107.675C48.9543 96.2536 63.5591 92.3402 74.9807 98.9345L62.9807 119.719C56.3865 131.141 41.7817 135.054 30.3601 128.46L42.36 107.675Z" fill="black" /><Path d="M42.36 107.675C48.9543 96.2536 63.5591 92.3402 74.9807 98.9345L62.9807 119.719C56.3865 131.141 41.7817 135.054 30.3601 128.46L42.36 107.675Z" fill="black" fillOpacity="0.2" /><Path d="M99.1201 27H51.0001L75.0001 51L99.1201 27Z" fill="black" /><Path d="M99.1201 27H51.0001L75.0001 51L99.1201 27Z" fill="black" fillOpacity="0.2" /></G><G clipPath="url(#clip2_115_1632)"><Path d="M42 71.6699H108.776V76.4323H42V71.6699Z" fill="#DB921E" /><Path d="M69.6212 84.5388C69.6212 84.5388 64.967 79.8778 59.2 74.102C53.4329 68.3263 48.7788 63.6653 48.7788 63.6653C54.5459 57.8896 63.9553 57.8896 69.7223 63.6653C75.3882 69.3397 75.3882 78.7631 69.6212 84.5388Z" fill="#FFD700" /><Path d="M69.6212 84.5388C63.8542 90.3145 54.4448 90.3145 48.6777 84.5388C42.9107 78.7631 42.9107 69.3397 48.6777 63.564C48.6777 63.564 53.3318 68.2251 59.0989 74.0007C64.9671 79.7764 69.6212 84.5388 69.6212 84.5388Z" fill="#DBA21E" /><Path d="M102.098 84.5388C102.098 84.5388 97.4443 79.8778 91.6773 74.102C85.9102 68.3263 81.2561 63.6653 81.2561 63.6653C87.0232 57.8896 96.4326 57.8896 102.2 63.6653C107.866 69.3397 107.866 78.7631 102.098 84.5388Z" fill="#FFD700" /><Path d="M102.098 84.5388C96.3314 90.3145 86.9219 90.3145 81.1549 84.5388C75.3878 78.7631 75.3878 69.3397 81.1549 63.564C81.1549 63.564 85.809 68.2251 91.5761 74.0007C97.4443 79.7764 102.098 84.5388 102.098 84.5388Z" fill="#DBA21E" /><Path d="M73.3649 68.5L98.659 64.4259L101.694 41L104.73 64.4259L128 67.4815L104.73 70.537L101.694 96L98.659 70.537L73.3649 68.5Z" fill="white" /></G></G></G><Defs><LinearGradient id="paint0_linear_115_1632" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_1632"><Rect width="150" height="150" rx="20" fill="white" /></ClipPath><ClipPath id="clip1_115_1632"><Rect width="120" height="120" fill="white" transform="matrix(1 0 0 -1 15 135)" /></ClipPath><ClipPath id="clip2_115_1632"><Rect width="86" height="55" fill="white" transform="translate(42 41)" /></ClipPath></Defs></G></Svg>)
}

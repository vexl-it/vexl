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

export function AvatarGolden3({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_589)"><Rect x="-1" width="150" height="150" rx="20" fill="url(#paint0_linear_115_589)" /><G style={{mixBlendMode: 'soft-light'}}><Rect x="-1" width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><G clipPath="url(#clip1_115_589)"><Path d="M99.6752 135L118.776 66.2106C120.9 58.5645 115.149 51 107.214 51H75V135H99.6752Z" fill="black" /><Path d="M99.6752 135L118.776 66.2106C120.9 58.5645 115.149 51 107.214 51H75V135H99.6752Z" fill="black" fillOpacity="0.2" /><Path d="M111.12 15L75.1201 51V15L111.12 15Z" fill="black" /><Path d="M111.12 15L75.1201 51V15L111.12 15Z" fill="black" fillOpacity="0.2" /><Path d="M27 75L75 27V75H27Z" fill="black" /><Path d="M27 75L75 27V75H27Z" fill="black" fillOpacity="0.2" /><Path d="M75 123L27 75H75V123Z" fill="black" /><Path d="M75 123L27 75H75V123Z" fill="black" fillOpacity="0.2" /><G clipPath="url(#clip2_115_589)"><Path d="M42 71.6702H108.776V76.4325H42V71.6702Z" fill="#DB921E" /><Path d="M69.6212 84.5389C69.6212 84.5389 64.967 79.8779 59.2 74.1022C53.4329 68.3265 48.7788 63.6654 48.7788 63.6654C54.5459 57.8897 63.9553 57.8897 69.7223 63.6654C75.3882 69.3398 75.3882 78.7632 69.6212 84.5389Z" fill="#FFD700" /><Path d="M69.6211 84.5386C63.854 90.3144 54.4446 90.3144 48.6776 84.5386C42.9105 78.7629 42.9105 69.3395 48.6776 63.5638C48.6776 63.5638 53.3317 68.2249 59.0988 74.0005C64.967 79.7763 69.6211 84.5386 69.6211 84.5386Z" fill="#DBA21E" /><Path d="M102.098 84.5389C102.098 84.5389 97.4443 79.8779 91.6773 74.1022C85.9102 68.3265 81.2561 63.6654 81.2561 63.6654C87.0232 57.8897 96.4326 57.8897 102.2 63.6654C107.866 69.3398 107.866 78.7632 102.098 84.5389Z" fill="#FFD700" /><Path d="M102.098 84.5386C96.3314 90.3144 86.9219 90.3144 81.1549 84.5386C75.3878 78.7629 75.3878 69.3395 81.1549 63.5638C81.1549 63.5638 85.809 68.2249 91.5761 74.0005C97.4443 79.7763 102.098 84.5386 102.098 84.5386Z" fill="#DBA21E" /><Path d="M73.365 68.5L98.6591 64.4259L101.694 41L104.73 64.4259L128 67.4815L104.73 70.537L101.694 96L98.6591 70.537L73.365 68.5Z" fill="white" /></G></G></G><Defs><LinearGradient id="paint0_linear_115_589" x1="-1" y1="0" x2="149" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_589"><Rect width="150" height="150" rx="20" fill="white" /></ClipPath><ClipPath id="clip1_115_589"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath><ClipPath id="clip2_115_589"><Rect width="86" height="55" fill="white" transform="translate(42 41)" /></ClipPath></Defs></G></Svg>)
}

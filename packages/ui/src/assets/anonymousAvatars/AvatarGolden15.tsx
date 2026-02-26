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

export function AvatarGolden15({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_991)"><Rect width="150" height="150" rx="20" fill="url(#paint0_linear_115_991)" /><G style={{mixBlendMode: 'soft-light'}}><Rect width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><G clipPath="url(#clip1_115_991)"><Mask id="mask0_115_991" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 135H15V15H135V135Z" fill="white" /></Mask><G mask="url(#mask0_115_991)"><Mask id="mask1_115_991" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="26" y="26" width="49" height="97"><Path d="M74.8799 26.8801V122.88H26.8799L26.8799 26.8801H74.8799Z" fill="white" /></Mask><G mask="url(#mask1_115_991)"><Path d="M26.8804 26.88C26.8804 26.88 26.8804 48.3704 26.8804 74.88C26.8804 101.39 26.8804 122.88 26.8804 122.88C53.39 122.88 74.8804 101.39 74.8804 74.88C74.8804 48.3704 53.3901 26.88 26.8804 26.88Z" fill="black" /><Path d="M26.8804 26.88C26.8804 26.88 26.8804 48.3704 26.8804 74.88C26.8804 101.39 26.8804 122.88 26.8804 122.88C53.39 122.88 74.8804 101.39 74.8804 74.88C74.8804 48.3704 53.3901 26.88 26.8804 26.88Z" fill="black" fillOpacity="0.2" /></G><Mask id="mask2_115_991" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="75" y="26" width="49" height="97"><Path d="M75.1201 122.88V26.88L123.12 26.88V122.88H75.1201Z" fill="white" /></Mask><G mask="url(#mask2_115_991)"><Path d="M123.12 122.88C123.12 122.88 123.12 101.39 123.12 74.8801C123.12 48.3704 123.12 26.88 123.12 26.88C96.61 26.88 75.1196 48.3704 75.1196 74.8801C75.1196 101.39 96.61 122.88 123.12 122.88Z" fill="black" /><Path d="M123.12 122.88C123.12 122.88 123.12 101.39 123.12 74.8801C123.12 48.3704 123.12 26.88 123.12 26.88C96.61 26.88 75.1196 48.3704 75.1196 74.8801C75.1196 101.39 96.61 122.88 123.12 122.88Z" fill="black" fillOpacity="0.2" /></G><Path d="M75.1201 74.88H44.6401V15H75.1201V74.88Z" fill="black" /><Path d="M75.1201 74.88H44.6401V15H75.1201V74.88Z" fill="black" fillOpacity="0.2" /><Path d="M105.84 135H75.1201V75.12H105.84V135Z" fill="black" /><Path d="M105.84 135H75.1201V75.12H105.84V135Z" fill="black" fillOpacity="0.2" /></G><G clipPath="url(#clip2_115_991)"><Path d="M42 72.6702H108.776V77.4326H42V72.6702Z" fill="#DB921E" /><Path d="M69.6212 85.5389C69.6212 85.5389 64.967 80.8779 59.2 75.1022C53.4329 69.3264 48.7788 64.6654 48.7788 64.6654C54.5459 58.8897 63.9553 58.8897 69.7223 64.6654C75.3882 70.3398 75.3882 79.7632 69.6212 85.5389Z" fill="#FFD700" /><Path d="M69.6212 85.5386C63.8542 91.3143 54.4448 91.3143 48.6777 85.5386C42.9107 79.7629 42.9107 70.3394 48.6777 64.5637C48.6777 64.5637 53.3318 69.2249 59.0989 75.0005C64.9671 80.7762 69.6212 85.5386 69.6212 85.5386Z" fill="#DBA21E" /><Path d="M102.098 85.5389C102.098 85.5389 97.4443 80.8779 91.6773 75.1022C85.9102 69.3264 81.2561 64.6654 81.2561 64.6654C87.0232 58.8897 96.4326 58.8897 102.2 64.6654C107.866 70.3398 107.866 79.7632 102.098 85.5389Z" fill="#FFD700" /><Path d="M102.098 85.5386C96.3314 91.3143 86.9219 91.3143 81.1549 85.5386C75.3878 79.7629 75.3878 70.3394 81.1549 64.5637C81.1549 64.5637 85.809 69.2249 91.5761 75.0005C97.4443 80.7762 102.098 85.5386 102.098 85.5386Z" fill="#DBA21E" /><Path d="M73.3649 69.5L98.659 65.4259L101.694 42L104.73 65.4259L128 68.4815L104.73 71.537L101.694 97L98.659 71.537L73.3649 69.5Z" fill="white" /></G></G></G><Defs><LinearGradient id="paint0_linear_115_991" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_991"><Rect width="150" height="150" rx="20" fill="white" /></ClipPath><ClipPath id="clip1_115_991"><Rect width="120" height="120" fill="white" transform="matrix(1 0 0 -1 15 135)" /></ClipPath><ClipPath id="clip2_115_991"><Rect width="86" height="55" fill="white" transform="translate(42 42)" /></ClipPath></Defs></G></Svg>)
}

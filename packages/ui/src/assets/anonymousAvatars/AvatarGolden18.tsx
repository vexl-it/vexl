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

export function AvatarGolden18({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_1162)"><Rect width="150" height="150" rx="20" fill="url(#paint0_linear_115_1162)" /><G style={{mixBlendMode: 'soft-light'}}><Rect width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><G clipPath="url(#clip1_115_1162)"><Mask id="mask0_115_1162" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 135H15V15H135V135Z" fill="white" /></Mask><G mask="url(#mask0_115_1162)"><Path d="M53.4 15.0001H87V48.6001L53.4 15.0001Z" fill="black" /><Path d="M53.4 15.0001H87V48.6001L53.4 15.0001Z" fill="black" fillOpacity="0.2" /><Path d="M90.6 48.48C105.247 48.48 117.12 60.3534 117.12 75C117.12 89.6466 105.247 101.52 90.6 101.52C75.9534 101.52 64.08 89.6466 64.08 75C64.08 60.3534 75.9534 48.48 90.6 48.48Z" fill="black" /><Path d="M90.6 48.48C105.247 48.48 117.12 60.3534 117.12 75C117.12 89.6466 105.247 101.52 90.6 101.52C75.9534 101.52 64.08 89.6466 64.08 75C64.08 60.3534 75.9534 48.48 90.6 48.48Z" fill="black" fillOpacity="0.2" /><Path d="M50.3399 47.0399C63.5616 47.0399 74.2799 57.7582 74.2799 70.9799C74.2799 84.2016 63.5616 94.9199 50.3399 94.9199C37.1182 94.9199 26.3999 84.2016 26.3999 70.9799C26.3999 57.7582 37.1182 47.0399 50.3399 47.0399Z" fill="black" /><Path d="M50.3399 47.0399C63.5616 47.0399 74.2799 57.7582 74.2799 70.9799C74.2799 84.2016 63.5616 94.9199 50.3399 94.9199C37.1182 94.9199 26.3999 84.2016 26.3999 70.9799C26.3999 57.7582 37.1182 47.0399 50.3399 47.0399Z" fill="black" fillOpacity="0.2" /><Path d="M87 92.04C73.7452 92.04 63 102.785 63 116.04H87C100.255 116.04 111 105.295 111 92.04H87Z" fill="black" /><Path d="M87 92.04C73.7452 92.04 63 102.785 63 116.04H87C100.255 116.04 111 105.295 111 92.04H87Z" fill="black" fillOpacity="0.2" /><Path d="M63 99C76.2548 99 87 109.745 87 123H63C49.7452 123 39 112.255 39 99H63Z" fill="black" /><Path d="M63 99C76.2548 99 87 109.745 87 123H63C49.7452 123 39 112.255 39 99H63Z" fill="black" fillOpacity="0.2" /><Path d="M77.4 75C77.4 75 77.4 66.9411 77.4 57C77.4 47.0589 77.4 39 77.4 39C68.1216 39 60.6 47.0589 60.6 57C60.6 66.9411 68.1216 75 77.4 75Z" fill="black" /><Path d="M77.4 75C77.4 75 77.4 66.9411 77.4 57C77.4 47.0589 77.4 39 77.4 39C68.1216 39 60.6 47.0589 60.6 57C60.6 66.9411 68.1216 75 77.4 75Z" fill="black" fillOpacity="0.2" /></G><G clipPath="url(#clip2_115_1162)"><Path d="M42 71.6702H108.776V76.4326H42V71.6702Z" fill="#DB921E" /><Path d="M69.6212 84.539C69.6212 84.539 64.967 79.878 59.2 74.1023C53.4329 68.3266 48.7788 63.6655 48.7788 63.6655C54.5459 57.8898 63.9553 57.8898 69.7223 63.6655C75.3882 69.3399 75.3882 78.7633 69.6212 84.539Z" fill="#FFD700" /><Path d="M69.6212 84.5386C63.8542 90.3143 54.4448 90.3143 48.6777 84.5386C42.9107 78.7629 42.9107 69.3394 48.6777 63.5637C48.6777 63.5637 53.3318 68.2249 59.0989 74.0005C64.9671 79.7762 69.6212 84.5386 69.6212 84.5386Z" fill="#DBA21E" /><Path d="M102.098 84.539C102.098 84.539 97.4443 79.878 91.6773 74.1023C85.9102 68.3266 81.2561 63.6655 81.2561 63.6655C87.0232 57.8898 96.4326 57.8898 102.2 63.6655C107.866 69.3399 107.866 78.7633 102.098 84.539Z" fill="#FFD700" /><Path d="M102.098 84.5386C96.3314 90.3143 86.9219 90.3143 81.1549 84.5386C75.3878 78.7629 75.3878 69.3394 81.1549 63.5637C81.1549 63.5637 85.809 68.2249 91.5761 74.0005C97.4443 79.7762 102.098 84.5386 102.098 84.5386Z" fill="#DBA21E" /><Path d="M73.3649 68.5L98.659 64.4259L101.694 41L104.73 64.4259L128 67.4815L104.73 70.537L101.694 96L98.659 70.537L73.3649 68.5Z" fill="white" /></G></G></G><Defs><LinearGradient id="paint0_linear_115_1162" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_1162"><Rect width="150" height="150" rx="20" fill="white" /></ClipPath><ClipPath id="clip1_115_1162"><Rect width="120" height="120" fill="white" transform="matrix(1 0 0 -1 15 135)" /></ClipPath><ClipPath id="clip2_115_1162"><Rect width="86" height="55" fill="white" transform="translate(42 41)" /></ClipPath></Defs></G></Svg>)
}

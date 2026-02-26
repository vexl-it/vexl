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

export function AvatarGolden16({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_1054)"><Rect width="150" height="150" rx="20" fill="url(#paint0_linear_115_1054)" /><G style={{mixBlendMode: 'soft-light'}}><Rect width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><Path d="M111 15L51 75H111V15Z" fill="black" /><Path d="M111 15L51 75H111V15Z" fill="black" fillOpacity="0.2" /><Path d="M39 126.96L90.96 75H39V126.96Z" fill="black" /><Path d="M39 126.96L90.96 75H39V126.96Z" fill="black" fillOpacity="0.2" /><Path d="M75 26.88L27 74.8799H75V26.88Z" fill="black" /><Path d="M75 26.88L27 74.8799H75V26.88Z" fill="black" fillOpacity="0.2" /><Path d="M123 75L75 123H111C117.627 123 123 117.627 123 111V75Z" fill="black" /><Path d="M123 75L75 123H111C117.627 123 123 117.627 123 111V75Z" fill="black" fillOpacity="0.2" /><G clipPath="url(#clip1_115_1054)"><Path d="M42 72.6702H108.776V77.4326H42V72.6702Z" fill="#DB921E" /><Path d="M69.6212 85.5389C69.6212 85.5389 64.967 80.8779 59.2 75.1022C53.4329 69.3264 48.7788 64.6654 48.7788 64.6654C54.5459 58.8897 63.9553 58.8897 69.7223 64.6654C75.3882 70.3398 75.3882 79.7632 69.6212 85.5389Z" fill="#FFD700" /><Path d="M69.6212 85.5386C63.8542 91.3143 54.4448 91.3143 48.6777 85.5386C42.9107 79.7629 42.9107 70.3394 48.6777 64.5637C48.6777 64.5637 53.3318 69.2249 59.0989 75.0005C64.9671 80.7762 69.6212 85.5386 69.6212 85.5386Z" fill="#DBA21E" /><Path d="M102.098 85.5389C102.098 85.5389 97.4443 80.8779 91.6773 75.1022C85.9102 69.3264 81.2561 64.6654 81.2561 64.6654C87.0232 58.8897 96.4326 58.8897 102.2 64.6654C107.866 70.3398 107.866 79.7632 102.098 85.5389Z" fill="#FFD700" /><Path d="M102.098 85.5386C96.3314 91.3143 86.9219 91.3143 81.1549 85.5386C75.3878 79.7629 75.3878 70.3394 81.1549 64.5637C81.1549 64.5637 85.809 69.2249 91.5761 75.0005C97.4443 80.7762 102.098 85.5386 102.098 85.5386Z" fill="#DBA21E" /><Path d="M73.3649 69.5L98.659 65.4259L101.694 42L104.73 65.4259L128 68.4815L104.73 71.537L101.694 97L98.659 71.537L73.3649 69.5Z" fill="white" /></G></G><Defs><LinearGradient id="paint0_linear_115_1054" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_1054"><Rect width="150" height="150" rx="20" fill="white" /></ClipPath><ClipPath id="clip1_115_1054"><Rect width="86" height="55" fill="white" transform="translate(42 42)" /></ClipPath></Defs></G></Svg>)
}

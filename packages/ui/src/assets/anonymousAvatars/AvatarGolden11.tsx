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

export function AvatarGolden11({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_1363)"><Rect width="150" height="150" rx="20" fill="url(#paint0_linear_115_1363)" /><G style={{mixBlendMode: 'soft-light'}}><Rect width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><G clipPath="url(#clip1_115_1363)"><Mask id="mask0_115_1363" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 15H15V135H135V15Z" fill="white" /></Mask><G mask="url(#mask0_115_1363)"><Path d="M23.6399 36.1201L74.5199 87.0001H23.6399V36.1201Z" fill="black" /><Path d="M23.6399 36.1201L74.5199 87.0001H23.6399V36.1201Z" fill="black" fillOpacity="0.2" /><Path d="M34.4397 87H70.5597V123L34.4397 87Z" fill="black" /><Path d="M34.4397 87H70.5597V123L34.4397 87Z" fill="black" fillOpacity="0.2" /><Path d="M90.3 50.861C83.7057 39.4393 87.619 24.8345 99.0407 18.2402L111.041 39.0249C117.635 50.4465 113.722 65.0513 102.3 71.6456L90.3 50.861Z" fill="black" /><Path d="M90.3 50.861C83.7057 39.4393 87.619 24.8345 99.0407 18.2402L111.041 39.0249C117.635 50.4465 113.722 65.0513 102.3 71.6456L90.3 50.861Z" fill="black" fillOpacity="0.2" /><Path d="M59.5198 45.3228C66.114 56.7445 80.7188 60.6578 92.1404 54.0635L80.1404 33.2789C73.5462 21.8573 58.9414 17.944 47.5198 24.5383L59.5198 45.3228Z" fill="black" /><Path d="M59.5198 45.3228C66.114 56.7445 80.7188 60.6578 92.1404 54.0635L80.1404 33.2789C73.5462 21.8573 58.9414 17.944 47.5198 24.5383L59.5198 45.3228Z" fill="black" fillOpacity="0.2" /><Path d="M70.5601 83.04L94.6801 107.16H70.5601V83.04Z" fill="black" /><Path d="M70.5601 83.04L94.6801 107.16H70.5601V83.04Z" fill="black" fillOpacity="0.2" /></G><G clipPath="url(#clip2_115_1363)"><Path d="M42 69.6702H108.776V74.4326H42V69.6702Z" fill="#DB921E" /><Path d="M69.6212 82.539C69.6212 82.539 64.967 77.878 59.2 72.1023C53.4329 66.3266 48.7788 61.6655 48.7788 61.6655C54.5459 55.8898 63.9553 55.8898 69.7223 61.6655C75.3882 67.3399 75.3882 76.7633 69.6212 82.539Z" fill="#FFD700" /><Path d="M69.6211 82.5386C63.854 88.3143 54.4446 88.3143 48.6776 82.5386C42.9105 76.7629 42.9105 67.3394 48.6776 61.5637C48.6776 61.5637 53.3317 66.2249 59.0988 72.0005C64.967 77.7762 69.6211 82.5386 69.6211 82.5386Z" fill="#DBA21E" /><Path d="M102.098 82.539C102.098 82.539 97.4443 77.878 91.6773 72.1023C85.9102 66.3266 81.2561 61.6655 81.2561 61.6655C87.0232 55.8898 96.4326 55.8898 102.2 61.6655C107.866 67.3399 107.866 76.7633 102.098 82.539Z" fill="#FFD700" /><Path d="M102.098 82.5386C96.3314 88.3143 86.9219 88.3143 81.1549 82.5386C75.3878 76.7629 75.3878 67.3394 81.1549 61.5637C81.1549 61.5637 85.809 66.2249 91.5761 72.0005C97.4443 77.7762 102.098 82.5386 102.098 82.5386Z" fill="#DBA21E" /><Path d="M73.365 66.5L98.6591 62.4259L101.694 39L104.73 62.4259L128 65.4815L104.73 68.537L101.694 94L98.6591 68.537L73.365 66.5Z" fill="white" /></G></G></G><Defs><LinearGradient id="paint0_linear_115_1363" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_1363"><Rect width="150" height="150" rx="20" fill="white" /></ClipPath><ClipPath id="clip1_115_1363"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath><ClipPath id="clip2_115_1363"><Rect width="86" height="55" fill="white" transform="translate(42 39)" /></ClipPath></Defs></G></Svg>)
}

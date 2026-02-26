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

export function AvatarGolden2({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_503)"><Rect width="150" height="150" rx="20" fill="url(#paint0_linear_115_503)" /><G style={{mixBlendMode: 'soft-light'}}><Rect width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><G clipPath="url(#clip1_115_503)"><Mask id="mask0_115_503" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 15H15V135H135V15Z" fill="white" /></Mask><G mask="url(#mask0_115_503)"><Path d="M86.7601 15L106.052 96.2271C107.842 103.766 102.125 111 94.3763 111H62.6401V15L86.7601 15Z" fill="black" /><Mask id="mask1_115_503" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="11" y="2" width="101" height="101"><Path d="M77.7601 2.75992L11.2388 69.2812L44.4994 102.542L111.021 36.0205L77.7601 2.75992Z" fill="white" /></Mask><G mask="url(#mask1_115_503)"><Path d="M111.021 36.0204C111.021 36.0204 96.1294 50.9117 77.76 69.281C59.3907 87.6503 44.4994 102.542 44.4994 102.542C26.1301 84.1723 26.1301 54.3897 44.4994 36.0204C62.8687 17.651 92.6513 17.651 111.021 36.0204Z" fill="black" /></G><Mask id="mask2_115_503" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="29" y="71" width="69" height="70"><Path d="M52.4204 140.182L97.981 94.621L75.2007 71.8407L29.6401 117.401L52.4204 140.182Z" fill="white" /></Mask><G mask="url(#mask2_115_503)"><Path d="M29.6401 117.401C29.6401 117.401 39.8392 107.202 52.4204 94.6211C65.0017 82.0399 75.2007 71.8408 75.2007 71.8408C87.782 84.422 87.782 104.82 75.2007 117.401C62.6195 129.983 42.2213 129.983 29.6401 117.401Z" fill="black" /></G><Path d="M15 51L51 87H15V51Z" fill="black" /></G><G clipPath="url(#clip2_115_503)"><Path d="M42 57.6702H108.776V62.4325H42V57.6702Z" fill="#DB921E" /><Path d="M69.6212 70.5389C69.6212 70.5389 64.967 65.8779 59.2 60.1022C53.4329 54.3265 48.7788 49.6654 48.7788 49.6654C54.5459 43.8897 63.9553 43.8897 69.7223 49.6654C75.3882 55.3398 75.3882 64.7632 69.6212 70.5389Z" fill="#FFD700" /><Path d="M69.6211 70.5386C63.854 76.3144 54.4446 76.3144 48.6776 70.5386C42.9105 64.7629 42.9105 55.3395 48.6776 49.5638C48.6776 49.5638 53.3317 54.2249 59.0988 60.0005C64.967 65.7763 69.6211 70.5386 69.6211 70.5386Z" fill="#DBA21E" /><Path d="M102.098 70.5389C102.098 70.5389 97.4443 65.8779 91.6773 60.1022C85.9102 54.3265 81.2561 49.6654 81.2561 49.6654C87.0232 43.8897 96.4326 43.8897 102.2 49.6654C107.866 55.3398 107.866 64.7632 102.098 70.5389Z" fill="#FFD700" /><Path d="M102.098 70.5386C96.3314 76.3144 86.9219 76.3144 81.1549 70.5386C75.3878 64.7629 75.3878 55.3395 81.1549 49.5638C81.1549 49.5638 85.809 54.2249 91.5761 60.0005C97.4443 65.7763 102.098 70.5386 102.098 70.5386Z" fill="#DBA21E" /><Path d="M73.365 54.5L98.6591 50.4259L101.694 27L104.73 50.4259L128 53.4815L104.73 56.537L101.694 82L98.6591 56.537L73.365 54.5Z" fill="white" /></G></G></G><Defs><LinearGradient id="paint0_linear_115_503" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_503"><Rect width="150" height="150" rx="20" fill="white" /></ClipPath><ClipPath id="clip1_115_503"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath><ClipPath id="clip2_115_503"><Rect width="86" height="55" fill="white" transform="translate(42 27)" /></ClipPath></Defs></G></Svg>)
}

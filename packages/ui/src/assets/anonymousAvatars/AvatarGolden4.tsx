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

export function AvatarGolden4({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_622)"><Rect y="-2" width="150" height="150" rx="20" fill="url(#paint0_linear_115_622)" /><G style={{mixBlendMode: 'soft-light'}}><Rect y="-2" width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><G clipPath="url(#clip1_115_622)"><Path d="M27 15L87 75H27V15Z" fill="black" /><Path d="M27 15L87 75H27V15Z" fill="black" fillOpacity="0.2" /><Path d="M135 99L99 135V99H135Z" fill="black" /><Path d="M135 99L99 135V99H135Z" fill="black" fillOpacity="0.2" /><Path d="M111 15L75 51V15L111 15Z" fill="black" /><Path d="M111 15L75 51V15L111 15Z" fill="black" fillOpacity="0.2" /><Path d="M123 51H75V99H123V51Z" fill="black" /><Path d="M123 51H75V99H123V51Z" fill="black" fillOpacity="0.2" /><G clipPath="url(#clip2_115_622)"><Path d="M40 74.6702H106.776V79.4326H40V74.6702Z" fill="#DB921E" /><Path d="M67.6212 87.5389C67.6212 87.5389 62.967 82.8779 57.2 77.1022C51.4329 71.3264 46.7788 66.6654 46.7788 66.6654C52.5459 60.8897 61.9553 60.8897 67.7223 66.6654C73.3882 72.3398 73.3882 81.7632 67.6212 87.5389Z" fill="#FFD700" /><Path d="M67.6211 87.5386C61.854 93.3144 52.4446 93.3144 46.6776 87.5386C40.9105 81.7629 40.9105 72.3395 46.6776 66.5638C46.6776 66.5638 51.3317 71.2249 57.0988 77.0005C62.967 82.7763 67.6211 87.5386 67.6211 87.5386Z" fill="#DBA21E" /><Path d="M100.098 87.5389C100.098 87.5389 95.4443 82.8779 89.6773 77.1022C83.9102 71.3264 79.2561 66.6654 79.2561 66.6654C85.0232 60.8897 94.4326 60.8897 100.2 66.6654C105.866 72.3398 105.866 81.7632 100.098 87.5389Z" fill="#FFD700" /><Path d="M100.098 87.5386C94.3314 93.3144 84.9219 93.3144 79.1549 87.5386C73.3878 81.7629 73.3878 72.3395 79.1549 66.5638C79.1549 66.5638 83.809 71.2249 89.5761 77.0005C95.4443 82.7763 100.098 87.5386 100.098 87.5386Z" fill="#DBA21E" /><Path d="M71.365 71.5L96.6591 67.4259L99.6944 44L102.73 67.4259L126 70.4815L102.73 73.537L99.6944 99L96.6591 73.537L71.365 71.5Z" fill="white" /></G><Path d="M75.0001 111C75.0001 101.672 75.0001 77.4 75.0001 77.4C65.6554 77.4 58.0801 84.9623 58.0801 94.2908V111H75.0001Z" fill="black" /><Path d="M75.0001 111C75.0001 101.672 75.0001 77.4 75.0001 77.4C65.6554 77.4 58.0801 84.9623 58.0801 94.2908V111H75.0001Z" fill="black" fillOpacity="0.2" /></G></G><Defs><LinearGradient id="paint0_linear_115_622" x1="0" y1="-2" x2="150" y2="148" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_622"><Rect width="150" height="150" rx="20" fill="white" /></ClipPath><ClipPath id="clip1_115_622"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath><ClipPath id="clip2_115_622"><Rect width="86" height="55" fill="white" transform="translate(40 44)" /></ClipPath></Defs></G></Svg>)
}

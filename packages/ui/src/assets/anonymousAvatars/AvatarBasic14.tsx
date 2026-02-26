import React from 'react'
import Svg, {
  ClipPath,
  Defs,
  FeColorMatrix,
  Filter,
  G,
  Mask,
  Path,
  Rect,
} from 'react-native-svg'

interface Props {
  readonly size?: number
  readonly grayscale?: boolean
}

export function AvatarBasic14({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><G clipPath="url(#clip0_1_772)"><Mask id="mask0_1_772" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 15H15V135H135V15Z" fill="white" /></Mask><G mask="url(#mask0_1_772)"><Path d="M15 75L75 15V75H15Z" fill="#F8C471" /><Path d="M75 15L111 51H75V15Z" fill="#3D4D41" /><Path d="M75 51H123V75C123 88.2548 112.255 99 99 99H75V51Z" fill="#ACD9B7" /><Path d="M42.1206 72.7476H108.132V77.421H42.1206V72.7476Z" fill="black" /><Path d="M69.3892 85.4116C69.3892 85.4116 64.7657 80.7881 59.0624 75.0848C53.359 69.3814 48.7356 64.758 48.7356 64.758C54.4389 59.0546 63.6859 59.0546 69.3892 64.758C75.0925 70.4613 75.0925 79.7083 69.3892 85.4116Z" fill="#333333" /><Path d="M69.3895 85.4119C63.6861 91.1152 54.4392 91.1152 48.7358 85.4119C43.0325 79.7086 43.0325 70.4616 48.7358 64.7583C48.7358 64.7583 53.3593 69.3817 59.0627 75.0851C64.766 80.7884 69.3895 85.4119 69.3895 85.4119Z" fill="black" /><Path d="M101.519 85.4116C101.519 85.4116 96.895 80.7881 91.1917 75.0848C85.4883 69.3814 80.8648 64.758 80.8648 64.758C86.5682 59.0546 95.8151 59.0546 101.519 64.758C107.222 70.4613 107.222 79.7083 101.519 85.4116Z" fill="#333333" /><Path d="M101.519 85.4119C95.8153 91.1152 86.5683 91.1152 80.865 85.4119C75.1616 79.7086 75.1616 70.4616 80.865 64.7583C80.865 64.7583 85.4885 69.3817 91.1918 75.0851C96.8951 80.7884 101.519 85.4119 101.519 85.4119Z" fill="black" /><Path d="M78.1196 76.7998H73.6796V77.3998H78.1196V76.7998Z" fill="black" /><Path d="M75 98.9999C68.3368 98.9999 51 98.9999 51 98.9999C51 87.0706 51 77.3999 75 77.3999V98.9999Z" fill="#FCC5F3" /><Path d="M75 135C81.6632 135 99 135 99 135C99 115.118 99 99 75 99V135Z" fill="#3D4D41" /><Path d="M75 135C68.3368 135 51 135 51 135C51 115.118 51 99 75 99V135Z" fill="#ACD9B7" /></G></G><Defs><ClipPath id="clip0_1_772"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath></Defs></G></Svg>)
}

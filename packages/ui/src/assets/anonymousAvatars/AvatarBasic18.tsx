/* eslint-disable @typescript-eslint/no-deprecated */
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

export function AvatarBasic18({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><G clipPath="url(#clip0_1_1012)"><Mask id="mask0_1_1012" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 15H15V135H135V15Z" fill="white" /></Mask><G mask="url(#mask0_1_1012)"><Path d="M38.8799 15L86.9999 63H38.8799V15Z" fill="#F8C471" /><Path d="M111.12 99L75.1199 135V99H111.12Z" fill="#3D4D41" /><Path d="M75 99L51.12 122.88V99H75Z" fill="#ACD9B7" /><Path d="M75 39H87C106.882 39 123 55.1177 123 75V87H75V39Z" fill="#ACD9B7" /><Path d="M111.06 56.9999C117.72 56.9999 123.12 51.6004 123.12 44.9399C123.12 38.2793 117.72 32.8799 111.06 32.8799C104.399 32.8799 98.9998 38.2793 98.9998 44.9399C98.9998 51.6004 104.399 56.9999 111.06 56.9999Z" fill="#F8C471" /><Path d="M75.1199 75.1201H27.1199V99.0001H75.1199V75.1201Z" fill="#FCC5F3" /><Path d="M42.1201 72.7476H108.132V77.421H42.1201V72.7476Z" fill="black" /><Path d="M69.3888 85.4116C69.3888 85.4116 64.7654 80.7881 59.062 75.0848C53.3587 69.3814 48.7352 64.758 48.7352 64.758C54.4385 59.0546 63.6855 59.0546 69.3888 64.758C75.0922 70.4613 75.0922 79.7083 69.3888 85.4116Z" fill="#333333" /><Path d="M69.389 85.4119C63.6856 91.1152 54.4387 91.1152 48.7353 85.4119C43.032 79.7086 43.032 70.4616 48.7353 64.7583C48.7353 64.7583 53.3588 69.3817 59.0622 75.0851C64.7655 80.7884 69.389 85.4119 69.389 85.4119Z" fill="black" /><Path d="M101.518 85.4116C101.518 85.4116 96.8947 80.7881 91.1914 75.0848C85.4881 69.3814 80.8646 64.758 80.8646 64.758C86.5679 59.0546 95.8149 59.0546 101.518 64.758C107.222 70.4613 107.222 79.7083 101.518 85.4116Z" fill="#333333" /><Path d="M101.518 85.4119C95.815 91.1152 86.5681 91.1152 80.8647 85.4119C75.1614 79.7086 75.1614 70.4616 80.8647 64.7583C80.8647 64.7583 85.4882 69.3817 91.1916 75.0851C96.8949 80.7884 101.518 85.4119 101.518 85.4119Z" fill="black" /><Path d="M78.1192 76.7998H73.6792V77.3998H78.1192V76.7998Z" fill="black" /></G></G><Defs><ClipPath id="clip0_1_1012"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath></Defs></G></Svg>)
}

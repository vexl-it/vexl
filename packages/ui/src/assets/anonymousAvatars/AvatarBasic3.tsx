import React from 'react'
import Svg, {
  ClipPath,
  Defs,
  FeColorMatrix,
  Filter,
  G,
  Path,
  Rect,
} from 'react-native-svg'

interface Props {
  readonly size?: number
  readonly grayscale?: boolean
}

export function AvatarBasic3({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><G clipPath="url(#clip0_1_157)"><Path d="M99.6752 135L118.776 66.2106C120.9 58.5645 115.149 51 107.214 51H75V135H99.6752Z" fill="#F8C471" /><Path d="M111.12 15L75.12 51V15L111.12 15Z" fill="#3D4D41" /><Path d="M27 75L75 27V75H27Z" fill="#F6BAEC" /><Path d="M75 123L27 75H75V123Z" fill="#ACD9B7" /></G><Path d="M42.1206 72.2673H108.132V76.9406H42.1206V72.2673Z" fill="black" /><Path d="M69.3892 84.9312C69.3892 84.9312 64.7657 80.3077 59.0624 74.6043C53.359 68.901 48.7356 64.2775 48.7356 64.2775C54.4389 58.5742 63.6859 58.5742 69.3892 64.2775C75.0925 69.9809 75.0925 79.2278 69.3892 84.9312Z" fill="#333333" /><Path d="M69.3895 84.9313C63.6861 90.6346 54.4392 90.6346 48.7358 84.9313C43.0325 79.2279 43.0325 69.981 48.7358 64.2776C48.7358 64.2776 53.3593 68.9011 59.0627 74.6044C64.766 80.3078 69.3895 84.9313 69.3895 84.9313Z" fill="black" /><Path d="M101.518 84.9312C101.518 84.9312 96.895 80.3077 91.1917 74.6043C85.4883 68.901 80.8647 64.2775 80.8647 64.2775C86.5681 58.5742 95.815 58.5742 101.518 64.2775C107.222 69.9809 107.222 79.2278 101.518 84.9312Z" fill="#333333" /><Path d="M101.519 84.9313C95.8153 90.6346 86.5683 90.6346 80.865 84.9313C75.1616 79.2279 75.1616 69.981 80.865 64.2776C80.865 64.2776 85.4885 68.9011 91.1918 74.6044C96.8951 80.3078 101.519 84.9313 101.519 84.9313Z" fill="black" /><Defs><ClipPath id="clip0_1_157"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath></Defs></G></Svg>)
}

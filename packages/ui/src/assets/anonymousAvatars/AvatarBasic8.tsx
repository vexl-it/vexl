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

export function AvatarBasic8({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><G clipPath="url(#clip0_1_424)"><Mask id="mask0_1_424" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 15H15V135H135V15Z" fill="white" /></Mask><G mask="url(#mask0_1_424)"><Path d="M70.5601 51L123 103.44H70.5601V51Z" fill="#F8C471" /><Path d="M34.4399 99H70.5599V135L34.4399 99Z" fill="#3D4D41" /><Path d="M99.12 27.1201C112.309 27.1201 123 37.8116 123 51.0001H99C85.8114 51.0001 75.12 40.3087 75.12 27.1201H99.12Z" fill="#ACD9B7" /><Path d="M51.12 27C37.9314 27 27.24 37.6914 27.24 50.88H51.24C64.4285 50.88 75.12 40.1886 75.12 27H51.12Z" fill="#3D4D41" /><Path d="M42.1206 69.2678H108.132V73.9412H42.1206V69.2678Z" fill="black" /><Path d="M69.3892 81.9314C69.3892 81.9314 64.7657 77.3079 59.0624 71.6046C53.359 65.9012 48.7356 61.2777 48.7356 61.2777C54.4389 55.5744 63.6859 55.5744 69.3892 61.2777C75.0925 66.9811 75.0925 76.228 69.3892 81.9314Z" fill="#333333" /><Path d="M69.3895 81.9315C63.6861 87.6348 54.4392 87.6348 48.7358 81.9315C43.0325 76.2281 43.0325 66.9812 48.7358 61.2778C48.7358 61.2778 53.3593 65.9013 59.0627 71.6046C64.766 77.308 69.3895 81.9315 69.3895 81.9315Z" fill="black" /><Path d="M101.519 81.9314C101.519 81.9314 96.895 77.3079 91.1917 71.6046C85.4883 65.9012 80.8648 61.2777 80.8648 61.2777C86.5682 55.5744 95.8151 55.5744 101.519 61.2777C107.222 66.9811 107.222 76.228 101.519 81.9314Z" fill="#333333" /><Path d="M101.519 81.9315C95.8153 87.6348 86.5683 87.6348 80.865 81.9315C75.1616 76.2281 75.1616 66.9812 80.865 61.2778C80.865 61.2778 85.4885 65.9013 91.1918 71.6046C96.8951 77.308 101.519 81.9315 101.519 81.9315Z" fill="black" /><Path d="M78.1196 73.3201H73.6796V73.9201H78.1196V73.3201Z" fill="black" /><Path d="M94.5601 111L70.5601 135V111H94.5601Z" fill="#FCC5F3" /></G></G><Defs><ClipPath id="clip0_1_424"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath></Defs></G></Svg>)
}

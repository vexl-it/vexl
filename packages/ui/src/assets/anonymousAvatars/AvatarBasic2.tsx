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

export function AvatarBasic2({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><G clipPath="url(#clip0_1_71)"><Mask id="mask0_1_71" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 15H15V135H135V15Z" fill="white" /></Mask><G mask="url(#mask0_1_71)"><Path d="M86.7601 15L106.051 96.2271C107.842 103.766 102.125 111 94.3763 111H62.6401V15L86.7601 15Z" fill="#3D4D41" /><Mask id="mask1_1_71" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="11" y="2" width="101" height="101"><Path d="M77.7601 2.75991L11.2388 69.2812L44.4994 102.542L111.021 36.0205L77.7601 2.75991Z" fill="white" /></Mask><G mask="url(#mask1_1_71)"><Path d="M111.021 36.0204C111.021 36.0204 96.1294 50.9117 77.76 69.281C59.3907 87.6503 44.4994 102.542 44.4994 102.542C26.1301 84.1723 26.1301 54.3897 44.4994 36.0204C62.8687 17.651 92.6513 17.651 111.021 36.0204Z" fill="#ACD9B7" /></G><Mask id="mask2_1_71" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="29" y="71" width="69" height="70"><Path d="M52.4204 140.182L97.981 94.621L75.2007 71.8407L29.6401 117.401L52.4204 140.182Z" fill="white" /></Mask><G mask="url(#mask2_1_71)"><Path d="M29.64 117.401C29.64 117.401 39.8391 107.202 52.4203 94.6211C65.0016 82.0399 75.2006 71.8408 75.2006 71.8408C87.7819 84.422 87.7819 104.82 75.2006 117.401C62.6194 129.983 42.2212 129.983 29.64 117.401Z" fill="#F8C471" /></G><Path d="M42.1206 58.1077H108.132V62.781H42.1206V58.1077Z" fill="black" /><Path d="M69.3892 70.7715C69.3892 70.7715 64.7657 66.148 59.0624 60.4446C53.359 54.7413 48.7356 50.1178 48.7356 50.1178C54.4389 44.4145 63.6859 44.4145 69.3892 50.1178C75.0925 55.8212 75.0925 65.0681 69.3892 70.7715Z" fill="#333333" /><Path d="M69.3895 70.7716C63.6861 76.4749 54.4392 76.4749 48.7358 70.7716C43.0325 65.0682 43.0325 55.8213 48.7358 50.1179C48.7358 50.1179 53.3593 54.7414 59.0627 60.4447C64.766 66.1481 69.3895 70.7716 69.3895 70.7716Z" fill="black" /><Path d="M101.519 70.7715C101.519 70.7715 96.895 66.148 91.1917 60.4446C85.4883 54.7413 80.8648 50.1178 80.8648 50.1178C86.5682 44.4145 95.8151 44.4145 101.519 50.1178C107.222 55.8212 107.222 65.0681 101.519 70.7715Z" fill="#333333" /><Path d="M101.519 70.7716C95.8153 76.4749 86.5683 76.4749 80.865 70.7716C75.1616 65.0682 75.1616 55.8213 80.865 50.1179C80.865 50.1179 85.4885 54.7414 91.1918 60.4447C96.8951 66.1481 101.519 70.7716 101.519 70.7716Z" fill="black" /><Path d="M78.1196 62.16H73.6796V62.76H78.1196V62.16Z" fill="black" /><Path d="M15 51L51 87H15V51Z" fill="#F6BAEC" /></G></G><Defs><ClipPath id="clip0_1_71"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath></Defs></G></Svg>)
}

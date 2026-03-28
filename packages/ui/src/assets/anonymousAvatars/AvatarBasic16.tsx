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

export function AvatarBasic16({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><G clipPath="url(#clip0_1_880)"><Mask id="mask0_1_880" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 15H15V135H135V15Z" fill="white" /></Mask><G mask="url(#mask0_1_880)"><Path d="M112.8 99.1196L76.7996 135.12V99.1196H112.8Z" fill="#3D4D41" /><Mask id="mask1_1_880" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="27" y="51" width="97" height="49"><Path d="M123 51.1196H27.0005V99.1196H123V51.1196Z" fill="white" /></Mask><G mask="url(#mask1_1_880)"><Path d="M123 99.1191C123 99.1191 101.51 99.1191 75.0005 99.1191C48.4908 99.1191 27.0005 99.1191 27.0005 99.1191C27.0005 72.6095 48.4908 51.1191 75.0005 51.1191C101.51 51.1191 123 72.6095 123 99.1191Z" fill="#ACD9B7" /></G><Path d="M38.9995 50.9996L74.9995 14.9995V50.9996H38.9995Z" fill="#3D4D41" /><Path d="M42.1204 72.7471H108.132V77.4205H42.1204V72.7471Z" fill="black" /><Path d="M69.3891 85.4106C69.3891 85.4106 64.7656 80.7871 59.0623 75.0838C53.3589 69.3805 48.7354 64.757 48.7354 64.757C54.4388 59.0536 63.6857 59.0536 69.3891 64.757C75.0924 70.4603 75.0924 79.7073 69.3891 85.4106Z" fill="#333333" /><Path d="M69.3892 85.4109C63.6859 91.1143 54.4389 91.1143 48.7356 85.4109C43.0322 79.7076 43.0322 70.4606 48.7356 64.7573C48.7356 64.7573 53.3591 69.3807 59.0624 75.0841C64.7658 80.7874 69.3892 85.4109 69.3892 85.4109Z" fill="black" /><Path d="M101.518 85.4106C101.518 85.4106 96.8947 80.7871 91.1914 75.0838C85.4881 69.3805 80.8646 64.757 80.8646 64.757C86.5679 59.0536 95.8149 59.0536 101.518 64.757C107.222 70.4603 107.222 79.7073 101.518 85.4106Z" fill="#333333" /><Path d="M101.518 85.4109C95.815 91.1143 86.5681 91.1143 80.8647 85.4109C75.1614 79.7076 75.1614 70.4606 80.8647 64.7573C80.8647 64.7573 85.4882 69.3807 91.1916 75.0841C96.8949 80.7874 101.518 85.4109 101.518 85.4109Z" fill="black" /><Path d="M78.1194 76.7993H73.6794V77.3993H78.1194V76.7993Z" fill="black" /><Path d="M92.9995 14.9995C92.9995 14.9995 92.9995 23.0853 92.9995 33.0595C92.9995 43.0337 92.9995 51.1195 92.9995 51.1195C83.0584 51.1195 74.9995 43.0337 74.9995 33.0595C74.9995 23.0853 83.0584 14.9995 92.9995 14.9995Z" fill="#F8C471" /><Path d="M76.7996 111C76.7996 101.671 76.7996 77.0396 76.7996 77.0396C67.455 77.0396 59.8796 84.6017 59.8796 93.9302V111H76.7996Z" fill="#FCC5F3" /></G></G><Defs><ClipPath id="clip0_1_880"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath></Defs></G></Svg>)
}

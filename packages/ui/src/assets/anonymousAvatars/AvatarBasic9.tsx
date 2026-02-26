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

export function AvatarBasic9({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><G clipPath="url(#clip0_1_482)"><Mask id="mask0_1_482" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 15H15V135H135V15Z" fill="white" /></Mask><G mask="url(#mask0_1_482)"><Path d="M53.4 135H87V101.4L53.4 135Z" fill="#3D4D41" /><Path d="M90.6 101.52C105.247 101.52 117.12 89.6466 117.12 75C117.12 60.3534 105.247 48.48 90.6 48.48C75.9534 48.48 64.08 60.3534 64.08 75C64.08 89.6466 75.9534 101.52 90.6 101.52Z" fill="#FCC5F3" /><Path d="M50.3399 102.96C63.5616 102.96 74.2799 92.2418 74.2799 79.0201C74.2799 65.7984 63.5616 55.0801 50.3399 55.0801C37.1182 55.0801 26.3999 65.7984 26.3999 79.0201C26.3999 92.2418 37.1182 102.96 50.3399 102.96Z" fill="#ACD9B7" /><Path d="M42.1205 72.7476H108.132V77.4209H42.1205V72.7476Z" fill="black" /><Path d="M69.3892 85.4114C69.3892 85.4114 64.7657 80.7879 59.0624 75.0845C53.359 69.3812 48.7356 64.7577 48.7356 64.7577C54.4389 59.0544 63.6859 59.0544 69.3892 64.7577C75.0925 70.4611 75.0925 79.708 69.3892 85.4114Z" fill="#333333" /><Path d="M69.3895 85.4115C63.6861 91.1148 54.4392 91.1148 48.7358 85.4115C43.0325 79.7081 43.0325 70.4612 48.7358 64.7578C48.7358 64.7578 53.3593 69.3813 59.0627 75.0846C64.766 80.788 69.3895 85.4115 69.3895 85.4115Z" fill="black" /><Path d="M101.519 85.4114C101.519 85.4114 96.895 80.7879 91.1917 75.0845C85.4883 69.3812 80.8648 64.7577 80.8648 64.7577C86.5682 59.0544 95.8151 59.0544 101.519 64.7577C107.222 70.4611 107.222 79.708 101.519 85.4114Z" fill="#333333" /><Path d="M101.519 85.4115C95.8153 91.1148 86.5683 91.1148 80.865 85.4115C75.1616 79.7081 75.1616 70.4612 80.865 64.7578C80.865 64.7578 85.4885 69.3813 91.1918 75.0846C96.8951 80.788 101.519 85.4115 101.519 85.4115Z" fill="black" /><Path d="M78.1194 76.8H73.6794V77.4001H78.1194V76.8Z" fill="black" /><Path d="M87 57.96C73.7452 57.96 63 47.2148 63 33.96H87C100.255 33.96 111 44.7051 111 57.96H87Z" fill="#ACD9B7" /><Path d="M63 51C76.2548 51 87 40.2548 87 27H63C49.7452 27 39 37.7452 39 51H63Z" fill="#3D4D41" /><Path d="M77.4 75C77.4 75 77.4 83.0589 77.4 93C77.4 102.941 77.4 111 77.4 111C68.1216 111 60.6 102.941 60.6 93C60.6 83.0589 68.1216 75 77.4 75Z" fill="#F8C471" /></G></G><Defs><ClipPath id="clip0_1_482"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath></Defs></G></Svg>)
}

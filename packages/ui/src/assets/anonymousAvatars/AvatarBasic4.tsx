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

export function AvatarBasic4({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><G clipPath="url(#clip0_1_190)"><Path d="M27 15L87 75H27V15Z" fill="#F8C471" /><Path d="M135 99L99 135V99H135Z" fill="#3D4D41" /><Path d="M111 15L75 51V15L111 15Z" fill="#3D4D41" /><Path d="M123 51H75V99H123V51Z" fill="#ACD9B7" /><Path d="M42.1206 72.7477H108.132V77.4211H42.1206V72.7477Z" fill="black" /><Path d="M69.3893 85.4115C69.3893 85.4115 64.7658 80.788 59.0625 75.0847C53.3592 69.3813 48.7357 64.7578 48.7357 64.7578C54.439 59.0545 63.686 59.0545 69.3893 64.7578C75.0927 70.4612 75.0927 79.7081 69.3893 85.4115Z" fill="#333333" /><Path d="M69.3895 85.4115C63.6861 91.1148 54.4392 91.1148 48.7358 85.4115C43.0325 79.7081 43.0325 70.4612 48.7358 64.7578C48.7358 64.7578 53.3593 69.3813 59.0627 75.0846C64.766 80.788 69.3895 85.4115 69.3895 85.4115Z" fill="black" /><Path d="M101.519 85.4115C101.519 85.4115 96.895 80.788 91.1917 75.0847C85.4883 69.3813 80.8648 64.7578 80.8648 64.7578C86.5682 59.0545 95.8151 59.0545 101.519 64.7578C107.222 70.4612 107.222 79.7081 101.519 85.4115Z" fill="#333333" /><Path d="M101.519 85.4115C95.8153 91.1148 86.5683 91.1148 80.865 85.4115C75.1616 79.7081 75.1616 70.4612 80.865 64.7578C80.865 64.7578 85.4885 69.3813 91.1918 75.0846C96.8951 80.788 101.519 85.4115 101.519 85.4115Z" fill="black" /><Path d="M78.1194 76.8H73.6794V77.4001H78.1194V76.8Z" fill="black" /><Path d="M75.0001 111C75.0001 101.672 75.0001 77.4 75.0001 77.4C65.6554 77.4 58.0801 84.9623 58.0801 94.2908V111H75.0001Z" fill="#FCC5F3" /></G><Defs><ClipPath id="clip0_1_190"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath></Defs></G></Svg>)
}

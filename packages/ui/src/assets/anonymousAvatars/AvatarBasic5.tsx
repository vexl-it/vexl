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

export function AvatarBasic5({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><G clipPath="url(#clip0_1_232)"><Mask id="mask0_1_232" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 15H15V135H135V15Z" fill="white" /></Mask><G mask="url(#mask0_1_232)"><Mask id="mask1_1_232" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="27" y="63" width="96" height="48"><Path d="M27.0001 111L123 111V63L27.0001 63V111Z" fill="white" /></Mask><G mask="url(#mask1_1_232)"><Path d="M27.0001 63.0002C27.0001 63.0002 48.4904 63.0002 75 63.0002C101.51 63.0002 123 63.0002 123 63.0002C123 89.5098 101.51 111 75 111C48.4904 111 27.0001 89.5098 27.0001 63.0002Z" fill="#ACD9B7" /></G><Path d="M111.12 134.981H38.917L75.0186 98.8799L111.12 134.981Z" fill="#FCC5F3" /><Path d="M50.9336 38.9628H99.0989L75.0163 63.0454L50.9336 38.9628Z" fill="#3D4D41" /><Path d="M75 45.2401C81.6274 45.2401 87 39.8675 87 33.2401C87 26.6127 81.6274 21.2401 75 21.2401C68.3726 21.2401 63 26.6127 63 33.2401C63 39.8675 68.3726 45.2401 75 45.2401Z" fill="#F8C471" /><Path d="M42.1206 72.7477H108.132V77.4211H42.1206V72.7477Z" fill="black" /><Path d="M69.3893 85.4115C69.3893 85.4115 64.7658 80.788 59.0625 75.0847C53.3592 69.3813 48.7357 64.7578 48.7357 64.7578C54.439 59.0545 63.686 59.0545 69.3893 64.7578C75.0927 70.4612 75.0927 79.7081 69.3893 85.4115Z" fill="#333333" /><Path d="M69.3895 85.4115C63.6861 91.1148 54.4392 91.1148 48.7358 85.4115C43.0325 79.7081 43.0325 70.4612 48.7358 64.7578C48.7358 64.7578 53.3593 69.3813 59.0627 75.0846C64.766 80.788 69.3895 85.4115 69.3895 85.4115Z" fill="black" /><Path d="M101.519 85.4115C101.519 85.4115 96.895 80.788 91.1917 75.0847C85.4883 69.3813 80.8648 64.7578 80.8648 64.7578C86.5682 59.0545 95.8151 59.0545 101.519 64.7578C107.222 70.4612 107.222 79.7081 101.519 85.4115Z" fill="#333333" /><Path d="M101.519 85.4115C95.8153 91.1148 86.5683 91.1148 80.865 85.4115C75.1616 79.7081 75.1616 70.4612 80.865 64.7578C80.865 64.7578 85.4885 69.3813 91.1918 75.0846C96.8951 80.788 101.519 85.4115 101.519 85.4115Z" fill="black" /><Path d="M78.1194 76.8H73.6794V77.4001H78.1194V76.8Z" fill="black" /></G></G><Defs><ClipPath id="clip0_1_232"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath></Defs></G></Svg>)
}

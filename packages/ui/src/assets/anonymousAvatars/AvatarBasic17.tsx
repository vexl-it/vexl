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

export function AvatarBasic17({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><G clipPath="url(#clip0_1_954)"><Mask id="mask0_1_954" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 15H15V135H135V15Z" fill="white" /></Mask><G mask="url(#mask0_1_954)"><Path d="M27 75.1201L74.88 123H27V75.1201Z" fill="#F8C471" /><Path d="M123 75.1201L75.12 123H123V75.1201Z" fill="#ACD9B7" /><Path d="M107.14 42.3248C100.546 53.7464 85.9411 57.6598 74.5195 51.0655L86.5195 30.2809C93.1138 18.8593 107.719 14.9459 119.14 21.5402L107.14 42.3248Z" fill="#3D4D41" /><Path d="M42.36 42.3248C48.9543 53.7464 63.5591 57.6598 74.9807 51.0655L62.9807 30.2809C56.3865 18.8593 41.7817 14.9459 30.3601 21.5402L42.36 42.3248Z" fill="#ACD9B7" /><Path d="M42.1206 72.7476H108.132V77.4209H42.1206V72.7476Z" fill="black" /><Path d="M69.3893 85.4116C69.3893 85.4116 64.7658 80.7881 59.0625 75.0847C53.3592 69.3814 48.7357 64.7579 48.7357 64.7579C54.439 59.0546 63.686 59.0546 69.3893 64.7579C75.0927 70.4613 75.0927 79.7082 69.3893 85.4116Z" fill="#333333" /><Path d="M69.3895 85.4115C63.6861 91.1148 54.4392 91.1148 48.7358 85.4115C43.0325 79.7081 43.0325 70.4612 48.7358 64.7578C48.7358 64.7578 53.3593 69.3813 59.0627 75.0846C64.766 80.788 69.3895 85.4115 69.3895 85.4115Z" fill="black" /><Path d="M101.519 85.4116C101.519 85.4116 96.895 80.7881 91.1917 75.0847C85.4883 69.3814 80.8648 64.7579 80.8648 64.7579C86.5682 59.0546 95.8151 59.0546 101.519 64.7579C107.222 70.4613 107.222 79.7082 101.519 85.4116Z" fill="#333333" /><Path d="M101.519 85.4115C95.8153 91.1148 86.5683 91.1148 80.865 85.4115C75.1616 79.7081 75.1616 70.4612 80.865 64.7578C80.865 64.7578 85.4885 69.3813 91.1918 75.0846C96.8951 80.788 101.519 85.4115 101.519 85.4115Z" fill="black" /><Path d="M78.1194 76.7998H73.6794V77.3998H78.1194V76.7998Z" fill="black" /><Path d="M99.1201 123H51.0001L75.0001 99L99.1201 123Z" fill="#FCC5F3" /></G></G><Defs><ClipPath id="clip0_1_954"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath></Defs></G></Svg>)
}

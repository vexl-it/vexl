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

export function AvatarBasic12({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><G clipPath="url(#clip0_1_628)"><Mask id="mask0_1_628" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 15H15V135H135V15Z" fill="white" /></Mask><G mask="url(#mask0_1_628)"><Path d="M39 123L99 63V123H39Z" fill="#3D4D41" /><Mask id="mask1_1_628" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="27" y="51" width="96" height="48"><Path d="M123 51H27V99H123V51Z" fill="white" /></Mask><G mask="url(#mask1_1_628)"><Path d="M123 98.9997C123 98.9997 101.51 98.9997 75 98.9997C48.4903 98.9997 27 98.9997 27 98.9997C27 72.4901 48.4903 50.9998 75 50.9998C101.51 50.9998 123 72.4901 123 98.9997Z" fill="#ACD9B7" /></G><Mask id="mask2_1_628" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="52" y="2" width="102" height="102"><Path d="M153.904 69.9222L86.0215 2.04004L52.0804 35.9812L119.963 103.863L153.904 69.9222Z" fill="white" /></Mask><G mask="url(#mask2_1_628)"><Path d="M119.963 103.863C119.963 103.863 104.767 88.6673 86.0217 69.9221C67.2766 51.177 52.0806 35.981 52.0806 35.981C70.8258 17.2358 101.218 17.2358 119.963 35.981C138.708 54.7262 138.708 85.1181 119.963 103.863Z" fill="#F8C471" /></G><Path d="M42.1206 72.7478H108.132V77.4212H42.1206V72.7478Z" fill="black" /><Path d="M69.3893 85.4114C69.3893 85.4114 64.7658 80.7879 59.0625 75.0845C53.3592 69.3812 48.7357 64.7577 48.7357 64.7577C54.439 59.0544 63.686 59.0544 69.3893 64.7577C75.0927 70.4611 75.0927 79.708 69.3893 85.4114Z" fill="#333333" /><Path d="M69.3895 85.4115C63.6861 91.1148 54.4392 91.1148 48.7358 85.4115C43.0325 79.7081 43.0325 70.4612 48.7358 64.7578C48.7358 64.7578 53.3593 69.3813 59.0627 75.0846C64.766 80.788 69.3895 85.4115 69.3895 85.4115Z" fill="black" /><Path d="M101.519 85.4114C101.519 85.4114 96.895 80.7879 91.1917 75.0845C85.4883 69.3812 80.8648 64.7577 80.8648 64.7577C86.5682 59.0544 95.8151 59.0544 101.519 64.7577C107.222 70.4611 107.222 79.708 101.519 85.4114Z" fill="#333333" /><Path d="M101.519 85.4115C95.8153 91.1148 86.5683 91.1148 80.865 85.4115C75.1616 79.7081 75.1616 70.4612 80.865 64.7578C80.865 64.7578 85.4885 69.3813 91.1918 75.0846C96.8951 80.788 101.519 85.4115 101.519 85.4115Z" fill="black" /><Path d="M78.1194 76.8H73.6794V77.4001H78.1194V76.8Z" fill="black" /><Path d="M76.92 111C76.92 101.672 76.92 77.4001 76.92 77.4001C67.5753 77.4001 60 84.9624 60 94.2909V111H76.92Z" fill="#FCC5F3" /></G></G><Defs><ClipPath id="clip0_1_628"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath></Defs></G></Svg>)
}

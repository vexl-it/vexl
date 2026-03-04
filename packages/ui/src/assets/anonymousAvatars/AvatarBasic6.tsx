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

export function AvatarBasic6({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><G clipPath="url(#clip0_1_299)"><Mask id="mask0_1_299" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 15H15V135H135V15Z" fill="white" /></Mask><G mask="url(#mask0_1_299)"><Mask id="mask1_1_299" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="26" y="27" width="49" height="97"><Path d="M74.8799 123.12V27.12L26.8799 27.12L26.8799 123.12H74.8799Z" fill="white" /></Mask><G mask="url(#mask1_1_299)"><Path d="M26.8804 123.12C26.8804 123.12 26.8804 101.63 26.8804 75.12C26.8804 48.6103 26.8804 27.12 26.8804 27.12C53.39 27.12 74.8804 48.6103 74.8804 75.12C74.8804 101.63 53.3901 123.12 26.8804 123.12Z" fill="#ACD9B7" /></G><Mask id="mask2_1_299" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="75" y="27" width="49" height="97"><Path d="M75.1201 27.1201V123.12H123.12V27.1201H75.1201Z" fill="white" /></Mask><G mask="url(#mask2_1_299)"><Path d="M123.12 27.1199C123.12 27.1199 123.12 48.6102 123.12 75.1199C123.12 101.63 123.12 123.12 123.12 123.12C96.61 123.12 75.1196 101.63 75.1196 75.1199C75.1196 48.6102 96.61 27.1199 123.12 27.1199Z" fill="#F8C471" /></G><Path d="M75.1201 75.12H44.6401V135H75.1201V75.12Z" fill="#FCC5F3" /><Path d="M105.84 15H75.1201V74.88H105.84V15Z" fill="#3D4D41" /><Path d="M42.1206 72.7477H108.132V77.4211H42.1206V72.7477Z" fill="black" /><Path d="M69.3893 85.4115C69.3893 85.4115 64.7658 80.788 59.0625 75.0847C53.3592 69.3813 48.7357 64.7578 48.7357 64.7578C54.439 59.0545 63.686 59.0545 69.3893 64.7578C75.0927 70.4612 75.0927 79.7081 69.3893 85.4115Z" fill="#333333" /><Path d="M69.3895 85.4115C63.6861 91.1148 54.4392 91.1148 48.7358 85.4115C43.0325 79.7081 43.0325 70.4612 48.7358 64.7578C48.7358 64.7578 53.3593 69.3813 59.0627 75.0846C64.766 80.788 69.3895 85.4115 69.3895 85.4115Z" fill="black" /><Path d="M101.519 85.4115C101.519 85.4115 96.895 80.788 91.1917 75.0847C85.4883 69.3813 80.8648 64.7578 80.8648 64.7578C86.5682 59.0545 95.8151 59.0545 101.519 64.7578C107.222 70.4612 107.222 79.7081 101.519 85.4115Z" fill="#333333" /><Path d="M101.519 85.4115C95.8153 91.1148 86.5683 91.1148 80.865 85.4115C75.1616 79.7081 75.1616 70.4612 80.865 64.7578C80.865 64.7578 85.4885 69.3813 91.1918 75.0846C96.8951 80.788 101.519 85.4115 101.519 85.4115Z" fill="black" /><Path d="M78.1194 76.8H73.6794V77.4001H78.1194V76.8Z" fill="black" /></G></G><Defs><ClipPath id="clip0_1_299"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath></Defs></G></Svg>)
}

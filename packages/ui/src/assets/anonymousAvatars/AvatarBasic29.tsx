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

export function AvatarBasic29({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><G clipPath="url(#clip0_1_917)"><Mask id="mask0_1_917" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 135H15V15H135V135Z" fill="white" /></Mask><G mask="url(#mask0_1_917)"><Path d="M112.8 50.8804L76.7996 14.8803V50.8804H112.8Z" fill="#3D4D41" /><Mask id="mask1_1_917" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="27" y="50" width="97" height="49"><Path d="M123 98.8804H27.0005V50.8804H123V98.8804Z" fill="white" /></Mask><G mask="url(#mask1_1_917)"><Path d="M123 50.8809C123 50.8809 101.51 50.8809 75.0005 50.8809C48.4908 50.8809 27.0005 50.8809 27.0005 50.8809C27.0005 77.3905 48.4908 98.8809 75.0005 98.8809C101.51 98.8809 123 77.3905 123 50.8809Z" fill="#ACD9B7" /></G><Path d="M38.9995 99.0004L74.9995 135V99.0004H38.9995Z" fill="#3D4D41" /><Path d="M92.9995 135C92.9995 135 92.9995 126.915 92.9995 116.94C92.9995 106.966 92.9995 98.8805 92.9995 98.8805C83.0584 98.8805 74.9995 106.966 74.9995 116.94C74.9995 126.915 83.0584 135 92.9995 135Z" fill="#F8C471" /><Path d="M76.7996 39.0004C76.7996 48.3289 76.7996 72.9604 76.7996 72.9604C67.455 72.9604 59.8796 65.3983 59.8796 56.0698V39.0004H76.7996Z" fill="#FCC5F3" /></G><Path d="M42 72.2676H108.012V76.9409H42V72.2676Z" fill="black" /><Path d="M69.2686 84.9312C69.2686 84.9312 64.6451 80.3077 58.9418 74.6043C53.2384 68.901 48.615 64.2775 48.615 64.2775C54.3183 58.5742 63.5653 58.5742 69.2686 64.2775C74.9719 69.9809 74.9719 79.2278 69.2686 84.9312Z" fill="#333333" /><Path d="M69.2689 84.931C63.5655 90.6343 54.3186 90.6343 48.6152 84.931C42.9119 79.2276 42.9119 69.9807 48.6152 64.2773C48.6152 64.2773 53.2387 68.9008 58.9421 74.6041C64.6454 80.3075 69.2689 84.931 69.2689 84.931Z" fill="black" /><Path d="M101.398 84.9312C101.398 84.9312 96.7743 80.3077 91.071 74.6043C85.3676 68.901 80.7441 64.2775 80.7441 64.2775C86.4475 58.5742 95.6944 58.5742 101.398 64.2775C107.101 69.9809 107.101 79.2278 101.398 84.9312Z" fill="#333333" /><Path d="M101.398 84.931C95.6946 90.6343 86.4476 90.6343 80.7443 84.931C75.0409 79.2276 75.0409 69.9807 80.7443 64.2773C80.7443 64.2773 85.3679 68.9008 91.0712 74.6041C96.7745 80.3075 101.398 84.931 101.398 84.931Z" fill="black" /></G><Defs><ClipPath id="clip0_1_917"><Rect width="120" height="120" fill="white" transform="matrix(1 0 0 -1 15 135)" /></ClipPath></Defs></G></Svg>)
}

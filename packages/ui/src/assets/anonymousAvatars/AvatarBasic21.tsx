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

export function AvatarBasic21({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><G clipPath="url(#clip0_1_342)"><Mask id="mask0_1_342" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 135H15V15H135V135Z" fill="white" /></Mask><G mask="url(#mask0_1_342)"><Mask id="mask1_1_342" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="26" y="26" width="49" height="97"><Path d="M74.8799 26.8801V122.88H26.8799L26.8799 26.8801H74.8799Z" fill="white" /></Mask><G mask="url(#mask1_1_342)"><Path d="M26.8804 26.88C26.8804 26.88 26.8804 48.3704 26.8804 74.88C26.8804 101.39 26.8804 122.88 26.8804 122.88C53.39 122.88 74.8804 101.39 74.8804 74.88C74.8804 48.3704 53.3901 26.88 26.8804 26.88Z" fill="#ACD9B7" /></G><Mask id="mask2_1_342" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="75" y="26" width="49" height="97"><Path d="M75.1201 122.88V26.88L123.12 26.88V122.88H75.1201Z" fill="white" /></Mask><G mask="url(#mask2_1_342)"><Path d="M123.12 122.88C123.12 122.88 123.12 101.39 123.12 74.8801C123.12 48.3704 123.12 26.88 123.12 26.88C96.61 26.88 75.1196 48.3704 75.1196 74.8801C75.1196 101.39 96.61 122.88 123.12 122.88Z" fill="#F8C471" /></G><Path d="M75.1201 74.88H44.6401V15H75.1201V74.88Z" fill="#FCC5F3" /><Path d="M105.84 135H75.1201V75.12H105.84V135Z" fill="#3D4D41" /></G><Path d="M42 72.2673H108.012V76.9406H42V72.2673Z" fill="black" /><Path d="M69.2686 84.9312C69.2686 84.9312 64.6451 80.3077 58.9418 74.6043C53.2384 68.901 48.615 64.2775 48.615 64.2775C54.3183 58.5742 63.5653 58.5742 69.2686 64.2775C74.9719 69.9809 74.9719 79.2278 69.2686 84.9312Z" fill="#333333" /><Path d="M69.2689 84.9313C63.5655 90.6346 54.3186 90.6346 48.6152 84.9313C42.9119 79.2279 42.9119 69.981 48.6152 64.2776C48.6152 64.2776 53.2387 68.9011 58.9421 74.6044C64.6454 80.3078 69.2689 84.9313 69.2689 84.9313Z" fill="black" /><Path d="M101.398 84.9312C101.398 84.9312 96.7743 80.3077 91.071 74.6043C85.3676 68.901 80.7441 64.2775 80.7441 64.2775C86.4475 58.5742 95.6944 58.5742 101.398 64.2775C107.101 69.9809 107.101 79.2278 101.398 84.9312Z" fill="#333333" /><Path d="M101.398 84.9313C95.6946 90.6346 86.4476 90.6346 80.7443 84.9313C75.0409 79.2279 75.0409 69.981 80.7443 64.2776C80.7443 64.2776 85.3679 68.9011 91.0712 74.6044C96.7745 80.3078 101.398 84.9313 101.398 84.9313Z" fill="black" /></G><Defs><ClipPath id="clip0_1_342"><Rect width="120" height="120" fill="white" transform="matrix(1 0 0 -1 15 135)" /></ClipPath></Defs></G></Svg>)
}

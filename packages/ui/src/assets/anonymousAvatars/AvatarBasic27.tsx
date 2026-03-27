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

export function AvatarBasic27({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><G clipPath="url(#clip0_1_803)"><Mask id="mask0_1_803" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 135H15V15H135V135Z" fill="white" /></Mask><G mask="url(#mask0_1_803)"><Path d="M15 75L75 135V75H15Z" fill="#F8C471" /><Path d="M75 135L111 99H75V135Z" fill="#3D4D41" /><Path d="M75 99H123V75C123 61.7452 112.255 51 99 51H75V99Z" fill="#ACD9B7" /><Path d="M75 51.0001C68.3368 51.0001 51 51.0001 51 51.0001C51 62.9294 51 72.6001 75 72.6001V51.0001Z" fill="#FCC5F3" /><Path d="M75 15C81.6632 15 99 15 99 15C99 34.882 99 51 75 51V15Z" fill="#3D4D41" /><Path d="M75 15C68.3368 15 51 15 51 15C51 34.882 51 51 75 51V15Z" fill="#ACD9B7" /></G><Path d="M42 72.2676H108.012V76.9409H42V72.2676Z" fill="black" /><Path d="M69.2686 84.9312C69.2686 84.9312 64.6451 80.3077 58.9418 74.6043C53.2384 68.901 48.615 64.2775 48.615 64.2775C54.3183 58.5742 63.5653 58.5742 69.2686 64.2775C74.9719 69.9809 74.9719 79.2278 69.2686 84.9312Z" fill="#333333" /><Path d="M69.2689 84.931C63.5655 90.6343 54.3186 90.6343 48.6152 84.931C42.9119 79.2276 42.9119 69.9807 48.6152 64.2773C48.6152 64.2773 53.2387 68.9008 58.9421 74.6041C64.6454 80.3075 69.2689 84.931 69.2689 84.931Z" fill="black" /><Path d="M101.398 84.9312C101.398 84.9312 96.7743 80.3077 91.071 74.6043C85.3676 68.901 80.7441 64.2775 80.7441 64.2775C86.4475 58.5742 95.6944 58.5742 101.398 64.2775C107.101 69.9809 107.101 79.2278 101.398 84.9312Z" fill="#333333" /><Path d="M101.398 84.931C95.6946 90.6343 86.4476 90.6343 80.7443 84.931C75.0409 79.2276 75.0409 69.9807 80.7443 64.2773C80.7443 64.2773 85.3679 68.9008 91.0712 74.6041C96.7745 80.3075 101.398 84.931 101.398 84.931Z" fill="black" /></G><Defs><ClipPath id="clip0_1_803"><Rect width="120" height="120" fill="white" transform="matrix(1 0 0 -1 15 135)" /></ClipPath></Defs></G></Svg>)
}

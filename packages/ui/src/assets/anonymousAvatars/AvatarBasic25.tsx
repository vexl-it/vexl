import React from 'react'
import Svg, {Defs, FeColorMatrix, Filter, G, Path, Rect} from 'react-native-svg'

interface Props {
  readonly size?: number
  readonly grayscale?: boolean
}

export function AvatarBasic25({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><Path d="M94.9199 38.9999H50.9999V82.9199L94.9199 38.9999Z" fill="#3D4D41" /><Path d="M67.2 99H115.2V51L67.2 99Z" fill="#F8C471" /><Path d="M21 68.8799C21 85.4484 34.4315 98.8799 51 98.8799V68.8799C51 52.3113 37.5685 38.8799 21 38.8799V68.8799Z" fill="#ACD9B7" /><Path d="M75 99C88.2548 99 99 109.745 99 123H75C61.7452 123 51 112.255 51 99H75Z" fill="#3D4D41" /><Path d="M106.92 27L76.9204 56.9998H106.92V27Z" fill="#FCC5F3" /><Path d="M42 72.2673H108.012V76.9406H42V72.2673Z" fill="black" /><Path d="M69.2686 84.9312C69.2686 84.9312 64.6451 80.3077 58.9418 74.6043C53.2384 68.901 48.615 64.2775 48.615 64.2775C54.3183 58.5742 63.5653 58.5742 69.2686 64.2775C74.9719 69.9809 74.9719 79.2278 69.2686 84.9312Z" fill="#333333" /><Path d="M69.2689 84.9313C63.5655 90.6346 54.3186 90.6346 48.6152 84.9313C42.9119 79.2279 42.9119 69.981 48.6152 64.2776C48.6152 64.2776 53.2387 68.9011 58.9421 74.6044C64.6454 80.3078 69.2689 84.9313 69.2689 84.9313Z" fill="black" /><Path d="M101.398 84.9312C101.398 84.9312 96.7743 80.3077 91.071 74.6043C85.3676 68.901 80.7441 64.2775 80.7441 64.2775C86.4475 58.5742 95.6944 58.5742 101.398 64.2775C107.101 69.9809 107.101 79.2278 101.398 84.9312Z" fill="#333333" /><Path d="M101.398 84.9313C95.6946 90.6346 86.4476 90.6346 80.7443 84.9313C75.0409 79.2279 75.0409 69.981 80.7443 64.2776C80.7443 64.2776 85.3679 68.9011 91.0712 74.6044C96.7745 80.3078 101.398 84.9313 101.398 84.9313Z" fill="black" /></G></Svg>)
}

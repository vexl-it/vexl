import React from 'react'
import Svg, {Defs, FeColorMatrix, Filter, G, Path, Rect} from 'react-native-svg'

interface Props {
  readonly size?: number
  readonly grayscale?: boolean
}

export function AvatarBasic22({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><Path d="M111 15L51 75H111V15Z" fill="#FCC5F3" /><Path d="M39 126.96L90.96 75H39V126.96Z" fill="#F8C471" /><Path d="M75 26.88L27 74.8799H75V26.88Z" fill="#ACD9B7" /><Path d="M123 75L75 123H111C117.627 123 123 117.627 123 111V75Z" fill="#3D4D41" /><Path d="M42 72.2673H108.012V76.9406H42V72.2673Z" fill="black" /><Path d="M69.2686 84.9312C69.2686 84.9312 64.6451 80.3077 58.9418 74.6043C53.2384 68.901 48.615 64.2775 48.615 64.2775C54.3183 58.5742 63.5653 58.5742 69.2686 64.2775C74.9719 69.9809 74.9719 79.2278 69.2686 84.9312Z" fill="#333333" /><Path d="M69.2689 84.9313C63.5655 90.6346 54.3186 90.6346 48.6152 84.9313C42.9119 79.2279 42.9119 69.981 48.6152 64.2776C48.6152 64.2776 53.2387 68.9011 58.9421 74.6044C64.6454 80.3078 69.2689 84.9313 69.2689 84.9313Z" fill="black" /><Path d="M101.398 84.9312C101.398 84.9312 96.7743 80.3077 91.071 74.6043C85.3676 68.901 80.7441 64.2775 80.7441 64.2775C86.4475 58.5742 95.6944 58.5742 101.398 64.2775C107.101 69.9809 107.101 79.2278 101.398 84.9312Z" fill="#333333" /><Path d="M101.398 84.9313C95.6946 90.6346 86.4476 90.6346 80.7443 84.9313C75.0409 79.2279 75.0409 69.981 80.7443 64.2776C80.7443 64.2776 85.3679 68.9011 91.0712 74.6044C96.7745 80.3078 101.398 84.9313 101.398 84.9313Z" fill="black" /></G></Svg>)
}

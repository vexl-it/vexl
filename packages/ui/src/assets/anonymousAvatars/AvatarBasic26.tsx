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

export function AvatarBasic26({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><G clipPath="url(#clip0_1_743)"><Mask id="mask0_1_743" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 135H15V15H135V135Z" fill="white" /></Mask><G mask="url(#mask0_1_743)"><Path d="M23.64 113.88L74.52 62.9999H23.64V113.88Z" fill="#F8C471" /><Path d="M34.4399 63H70.5599V27L34.4399 63Z" fill="#ACD9B7" /><Path d="M90.3 99.139C83.7057 110.561 87.619 125.165 99.0407 131.76L111.041 110.975C117.635 99.5535 113.722 84.9487 102.3 78.3544L90.3 99.139Z" fill="#ACD9B7" /><Path d="M59.52 104.677C66.1142 93.2555 80.719 89.3422 92.1406 95.9365L80.1406 116.721C73.5464 128.143 58.9416 132.056 47.52 125.462L59.52 104.677Z" fill="#3D4D41" /><Path d="M70.5601 66.96L94.6801 42.84H70.5601V66.96Z" fill="#FCC5F3" /></G><Path d="M42 72.2676H108.012V76.9409H42V72.2676Z" fill="black" /><Path d="M69.2686 84.9312C69.2686 84.9312 64.6451 80.3077 58.9418 74.6043C53.2384 68.901 48.615 64.2775 48.615 64.2775C54.3183 58.5742 63.5653 58.5742 69.2686 64.2775C74.9719 69.9809 74.9719 79.2278 69.2686 84.9312Z" fill="#333333" /><Path d="M69.2689 84.931C63.5655 90.6343 54.3186 90.6343 48.6152 84.931C42.9119 79.2276 42.9119 69.9807 48.6152 64.2773C48.6152 64.2773 53.2387 68.9008 58.9421 74.6041C64.6454 80.3075 69.2689 84.931 69.2689 84.931Z" fill="black" /><Path d="M101.398 84.9312C101.398 84.9312 96.7743 80.3077 91.071 74.6043C85.3676 68.901 80.7441 64.2775 80.7441 64.2775C86.4475 58.5742 95.6944 58.5742 101.398 64.2775C107.101 69.9809 107.101 79.2278 101.398 84.9312Z" fill="#333333" /><Path d="M101.398 84.931C95.6946 90.6343 86.4476 90.6343 80.7443 84.931C75.0409 79.2276 75.0409 69.9807 80.7443 64.2773C80.7443 64.2773 85.3679 68.9008 91.0712 74.6041C96.7745 80.3075 101.398 84.931 101.398 84.931Z" fill="black" /></G><Defs><ClipPath id="clip0_1_743"><Rect width="120" height="120" fill="white" transform="matrix(1 0 0 -1 15 135)" /></ClipPath></Defs></G></Svg>)
}

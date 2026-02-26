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

export function AvatarBasic13({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><G clipPath="url(#clip0_1_714)"><Mask id="mask0_1_714" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="15" y="15" width="120" height="120"><Path d="M135 15H15V135H135V15Z" fill="white" /></Mask><G mask="url(#mask0_1_714)"><Path d="M23.64 36.1201L74.52 87.0001H23.64V36.1201Z" fill="#F8C471" /><Path d="M34.4399 87H70.5599V123L34.4399 87Z" fill="#ACD9B7" /><Path d="M90.3 50.861C83.7057 39.4393 87.619 24.8345 99.0407 18.2402L111.041 39.0249C117.635 50.4465 113.722 65.0513 102.3 71.6456L90.3 50.861Z" fill="#ACD9B7" /><Path d="M59.52 45.3228C66.1142 56.7445 80.719 60.6578 92.1406 54.0635L80.1406 33.2789C73.5464 21.8573 58.9416 17.944 47.52 24.5383L59.52 45.3228Z" fill="#3D4D41" /><Path d="M42.1206 69.2676H108.132V73.941H42.1206V69.2676Z" fill="black" /><Path d="M69.3892 81.9317C69.3892 81.9317 64.7657 77.3082 59.0624 71.6049C53.359 65.9015 48.7356 61.278 48.7356 61.278C54.4389 55.5747 63.6859 55.5747 69.3892 61.278C75.0925 66.9814 75.0925 76.2283 69.3892 81.9317Z" fill="#333333" /><Path d="M69.3895 81.9315C63.6861 87.6348 54.4392 87.6348 48.7358 81.9315C43.0325 76.2281 43.0325 66.9812 48.7358 61.2778C48.7358 61.2778 53.3593 65.9013 59.0627 71.6046C64.766 77.308 69.3895 81.9315 69.3895 81.9315Z" fill="black" /><Path d="M101.519 81.9317C101.519 81.9317 96.895 77.3082 91.1917 71.6049C85.4883 65.9015 80.8648 61.278 80.8648 61.278C86.5682 55.5747 95.8151 55.5747 101.519 61.278C107.222 66.9814 107.222 76.2283 101.519 81.9317Z" fill="#333333" /><Path d="M101.519 81.9315C95.8153 87.6348 86.5683 87.6348 80.865 81.9315C75.1616 76.2281 75.1616 66.9812 80.865 61.2778C80.865 61.2778 85.4885 65.9013 91.1918 71.6046C96.8951 77.308 101.519 81.9315 101.519 81.9315Z" fill="black" /><Path d="M78.1196 73.3203H73.6796V73.9203H78.1196V73.3203Z" fill="black" /><Path d="M70.5601 83.04L94.6801 107.16H70.5601V83.04Z" fill="#FCC5F3" /></G></G><Defs><ClipPath id="clip0_1_714"><Rect width="120" height="120" fill="white" transform="translate(15 15)" /></ClipPath></Defs></G></Svg>)
}

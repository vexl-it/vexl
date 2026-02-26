import React from 'react'
import Svg, {
  ClipPath,
  Defs,
  FeColorMatrix,
  Filter,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg'

interface Props {
  readonly size?: number
  readonly grayscale?: boolean
}

export function AvatarGolden1({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><G clipPath="url(#clip0_115_414)"><Rect width="150" height="150" rx="20" fill="url(#paint0_linear_115_414)" /><G style={{mixBlendMode: 'soft-light'}}><Rect width="150" height="150" rx="20" fill="black" fillOpacity="0.4" /></G><Path d="M117 85.7499L95.7502 107L74.5002 128.25L74.5002 85.7499L117 85.7499Z" fill="black" /><Path d="M74.606 21.9998H95.0414C101.301 21.9998 106.375 27.0739 106.375 33.3331V75.1248H74.606V21.9998Z" fill="black" /><Path d="M21.375 53.875L63.875 53.875L63.875 96.375L21.375 53.875Z" fill="black" /><Path d="M74.5 64.5001L74.5 106.788L53.25 106.788L63.875 64.5001L74.5 64.5001Z" fill="black" /><Path d="M45.3884 60.8922H107.733V65.306H45.3884V60.8922Z" fill="black" /><Path d="M71.1418 72.8526C71.1418 72.8526 66.7752 68.486 61.3887 63.0995C56.0022 57.713 51.6356 53.3464 51.6356 53.3464C57.0221 47.9599 65.7553 47.9599 71.1418 53.3464C76.5283 58.7329 76.5283 67.4661 71.1418 72.8526Z" fill="#333333" /><Path d="M71.1422 72.8529C65.7557 78.2394 57.0225 78.2394 51.636 72.8529C46.2495 67.4664 46.2495 58.7332 51.636 53.3467C51.636 53.3467 56.0026 57.7133 61.3891 63.0998C66.7756 68.4863 71.1422 72.8529 71.1422 72.8529Z" fill="black" /><Path d="M101.486 72.8526C101.486 72.8526 97.1194 68.486 91.7329 63.0995C86.3464 57.713 81.9798 53.3464 81.9798 53.3464C87.3663 47.9599 96.0995 47.9599 101.486 53.3464C106.873 58.7329 106.873 67.4661 101.486 72.8526Z" fill="#333333" /><Path d="M101.486 72.8529C96.0992 78.2394 87.366 78.2394 81.9795 72.8529C76.593 67.4664 76.593 58.7332 81.9795 53.3467C81.9795 53.3467 86.3461 57.7133 91.7326 63.0998C97.1191 68.4863 101.486 72.8529 101.486 72.8529Z" fill="black" /><Rect x="75.1941" y="64.7192" width="4.19333" height="0.566667" fill="black" /><G clipPath="url(#clip1_115_414)"><Path d="M43.8748 60.022H105.75V64.4056H43.8748V60.022Z" fill="#DB921E" /><Path d="M69.4685 71.8672C69.4685 71.8672 65.156 67.5769 59.8122 62.2606C54.4685 56.9443 50.156 52.654 50.156 52.654C55.4997 47.3378 64.2185 47.3378 69.5622 52.654C74.8122 57.877 74.8122 66.5509 69.4685 71.8672Z" fill="#FFD700" /><Path d="M69.4685 71.8669C64.1247 77.1832 55.406 77.1832 50.0623 71.8669C44.7185 66.5506 44.7185 57.8768 50.0623 52.5605C50.0623 52.5605 54.3747 56.8509 59.7185 62.167C65.156 67.4833 69.4685 71.8669 69.4685 71.8669Z" fill="#DBA21E" /><Path d="M99.562 71.8672C99.562 71.8672 95.2495 67.5769 89.9058 62.2606C84.562 56.9443 80.2495 52.654 80.2495 52.654C85.5933 47.3378 94.312 47.3378 99.6558 52.654C104.906 57.877 104.906 66.5509 99.562 71.8672Z" fill="#FFD700" /><Path d="M99.562 71.8669C94.2183 77.1832 85.4995 77.1832 80.1558 71.8669C74.812 66.5506 74.812 57.8768 80.1558 52.5605C80.1558 52.5605 84.4683 56.8509 89.812 62.167C95.2495 67.4833 99.562 71.8669 99.562 71.8669Z" fill="#DBA21E" /><Path d="M72.9375 57.1041L96.375 53.3541L99.1875 31.7916L102 53.3541L123.562 56.1666L102 58.9791L99.1875 82.4166L96.375 58.9791L72.9375 57.1041Z" fill="white" /></G></G><Defs><LinearGradient id="paint0_linear_115_414" x1="0" y1="0" x2="150" y2="150" gradientUnits="userSpaceOnUse"><Stop stopColor="#FBB000" /><Stop offset="0.335" stopColor="#7C5600" /><Stop offset="0.73" stopColor="#FFC132" /><Stop offset="1" stopColor="#684800" /></LinearGradient><ClipPath id="clip0_115_414"><Rect width="150" height="150" fill="white" /></ClipPath><ClipPath id="clip1_115_414"><Rect width="79.6875" height="50.625" fill="white" transform="translate(43.8748 31.7916)" /></ClipPath></Defs></G></Svg>)
}

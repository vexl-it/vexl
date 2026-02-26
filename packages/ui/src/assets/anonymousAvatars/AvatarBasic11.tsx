import React from 'react'
import Svg, {Defs, FeColorMatrix, Filter, G, Path, Rect} from 'react-native-svg'

interface Props {
  readonly size?: number
  readonly grayscale?: boolean
}

export function AvatarBasic11({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><Path d="M94.9199 111H50.9999V67.0801L94.9199 111Z" fill="#3D4D41" /><Path d="M67.2 51H115.2V99L67.2 51Z" fill="#F8C471" /><Path d="M21 81.1201C21 64.5516 34.4315 51.1201 51 51.1201V81.1201C51 97.6887 37.5685 111.12 21 111.12V81.1201Z" fill="#ACD9B7" /><Path d="M75 51C88.2548 51 99 40.2548 99 27H75C61.7452 27 51 37.7452 51 51H75Z" fill="#3D4D41" /><Path d="M42.1204 72.7478H108.132V77.4212H42.1204V72.7478Z" fill="black" /><Path d="M69.3891 85.4116C69.3891 85.4116 64.7656 80.7881 59.0623 75.0848C53.3589 69.3814 48.7354 64.758 48.7354 64.758C54.4388 59.0546 63.6857 59.0546 69.3891 64.758C75.0924 70.4613 75.0924 79.7083 69.3891 85.4116Z" fill="#333333" /><Path d="M69.3892 85.4117C63.6859 91.115 54.4389 91.115 48.7356 85.4117C43.0322 79.7084 43.0322 70.4614 48.7356 64.7581C48.7356 64.7581 53.3591 69.3815 59.0624 75.0849C64.7658 80.7882 69.3892 85.4117 69.3892 85.4117Z" fill="black" /><Path d="M101.519 85.4116C101.519 85.4116 96.895 80.7881 91.1917 75.0848C85.4883 69.3814 80.8648 64.758 80.8648 64.758C86.5682 59.0546 95.8151 59.0546 101.519 64.758C107.222 70.4613 107.222 79.7083 101.519 85.4116Z" fill="#333333" /><Path d="M101.519 85.4117C95.8153 91.115 86.5683 91.115 80.865 85.4117C75.1616 79.7084 75.1616 70.4614 80.865 64.7581C80.865 64.7581 85.4885 69.3815 91.1918 75.0849C96.8952 80.7882 101.519 85.4117 101.519 85.4117Z" fill="black" /><Path d="M78.1194 76.8H73.6794V77.4001H78.1194V76.8Z" fill="black" /><Path d="M106.92 123L76.9204 93.0002H106.92V123Z" fill="#FCC5F3" /></G></Svg>)
}

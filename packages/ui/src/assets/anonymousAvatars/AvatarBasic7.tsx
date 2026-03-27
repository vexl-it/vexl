import React from 'react'
import Svg, {Defs, FeColorMatrix, Filter, G, Path, Rect} from 'react-native-svg'

interface Props {
  readonly size?: number
  readonly grayscale?: boolean
}

export function AvatarBasic7({
  size = 150,
  grayscale = false,
}: Props): React.JSX.Element {
  // prettier-ignore
  return (<Svg width={size} height={size} viewBox="0 0 150 150" fill="none" >{grayscale ? (<Defs><Filter id="grayscale"><FeColorMatrix type="saturate" values="0" /></Filter></Defs>) : null}<G filter={grayscale ? "url(#grayscale)" : undefined}><Rect width="150" height="150" rx="20" fill="white" /><Path d="M111 135L51 75H111V135Z" fill="#FCC5F3" /><Path d="M39 23.04L90.96 75H39V23.04Z" fill="#F8C471" /><Path d="M75 123.12L27 75.1201H75V123.12Z" fill="#ACD9B7" /><Path d="M123 75L75 27H111C117.627 27 123 32.3726 123 39V75Z" fill="#3D4D41" /><Path d="M42.1206 72.7478H108.132V77.4212H42.1206V72.7478Z" fill="black" /><Path d="M69.3892 85.4116C69.3892 85.4116 64.7657 80.7881 59.0624 75.0848C53.359 69.3814 48.7356 64.758 48.7356 64.758C54.4389 59.0546 63.6859 59.0546 69.3892 64.758C75.0925 70.4613 75.0925 79.7083 69.3892 85.4116Z" fill="#333333" /><Path d="M69.3895 85.4117C63.6861 91.115 54.4392 91.115 48.7358 85.4117C43.0325 79.7084 43.0325 70.4614 48.7358 64.7581C48.7358 64.7581 53.3593 69.3815 59.0627 75.0849C64.766 80.7882 69.3895 85.4117 69.3895 85.4117Z" fill="black" /><Path d="M101.519 85.4116C101.519 85.4116 96.895 80.7881 91.1917 75.0848C85.4883 69.3814 80.8648 64.758 80.8648 64.758C86.5682 59.0546 95.8151 59.0546 101.519 64.758C107.222 70.4613 107.222 79.7083 101.519 85.4116Z" fill="#333333" /><Path d="M101.519 85.4117C95.8153 91.115 86.5683 91.115 80.865 85.4117C75.1616 79.7084 75.1616 70.4614 80.865 64.7581C80.865 64.7581 85.4885 69.3815 91.1918 75.0849C96.8951 80.7882 101.519 85.4117 101.519 85.4117Z" fill="black" /><Path d="M73.6796 76.8H78.1196V77.4001H73.6796V76.8Z" fill="black" /></G></Svg>)
}

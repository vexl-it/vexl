import React from 'react'
import Svg, {Path, Rect} from 'react-native-svg'

interface Props {
  readonly size?: number
}

export function MarketplaceLoaderSquare({size = 50}: Props): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 50 50" fill="none">
      <Rect width={50} height={50} fill="#ACD9B7" />
      <Path d="M0 0L50 50H0V0Z" fill="#82C492" />
      <Path d="M50 0V50L0 0H50Z" fill="#C0E4C9" />
    </Svg>
  )
}

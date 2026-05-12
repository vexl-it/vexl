import React from 'react'
import Svg, {Path} from 'react-native-svg'

interface Props {
  readonly size?: number
}

export function MarketplaceLoaderRibbon({size = 50}: Props): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 50 50" fill="none">
      <Path d="M0 0H50C50 13.8071 38.8071 25 25 25H0V0Z" fill="#FCC5F3" />
      <Path d="M25 25H50V50H0C0 36.1929 11.1929 25 25 25Z" fill="#FBA5EC" />
    </Svg>
  )
}

import React from 'react'
import Svg, {Path} from 'react-native-svg'

interface Props {
  readonly size?: number
}

export function MarketplaceLoaderCircle({size = 50}: Props): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 50 50" fill="none">
      <Path
        d="M0 25C0 11.1929 11.1929 0 25 0C38.8071 0 50 11.1929 50 25H0Z"
        fill="#FCCD6C"
      />
      <Path
        d="M50 25C50 38.8071 38.8071 50 25 50C11.1929 50 0 38.8071 0 25H50Z"
        fill="#EEB338"
      />
    </Svg>
  )
}

import React from 'react'
import Svg, {Path} from 'react-native-svg'

interface Props {
  readonly centerColor: string
  readonly color: string
  readonly width?: number
  readonly height?: number
}

export const MARKETPLACE_MAP_PIN_ASPECT_RATIO = 43 / 32

export function MarketplaceMapPin({
  centerColor,
  color,
  width = 32,
  height = width * MARKETPLACE_MAP_PIN_ASPECT_RATIO,
}: Props): React.JSX.Element {
  return (
    <Svg width={width} height={height} viewBox="0 0 32 43" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.733 41.915C19.87 39.039 32 27.195 32 16C32 7.163 24.837 0 16 0S0 7.163 0 16c0 10.952 12.145 22.989 15.273 25.908.415.388 1.042.391 1.46.007Z"
        fill={color}
      />
      <Path
        d="M16 21.142c2.524 0 4.571-2.047 4.571-4.571S18.524 12 16 12s-4.571 2.047-4.571 4.571S13.476 21.142 16 21.142Z"
        fill={centerColor}
      />
    </Svg>
  )
}

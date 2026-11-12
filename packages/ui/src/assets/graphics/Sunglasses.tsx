import React from 'react'
import {G, Path, Rect} from 'react-native-svg'

interface Props {
  readonly centerX: number
  readonly centerY: number
  readonly lensRadius: number
}

// Proportions measured from the brand sunglasses (apps/mobile/src/images/sunglasses.png).
const LENS_CENTER_OFFSET = 1.1
const ARM_OVERHANG = 0.16
const BAR_THICKNESS = 0.33

function Lens({
  cx,
  cy,
  r,
}: {
  readonly cx: number
  readonly cy: number
  readonly r: number
}): React.JSX.Element {
  const diagonal = r * Math.SQRT1_2
  const start = `M${cx - diagonal} ${cy - diagonal}`
  const end = `${cx + diagonal} ${cy + diagonal}Z`

  return (
    <>
      <Path d={`${start}A${r} ${r} 0 0 0 ${end}`} fill="black" />
      <Path d={`${start}A${r} ${r} 0 0 1 ${end}`} fill="#333333" />
    </>
  )
}

export function Sunglasses({
  centerX,
  centerY,
  lensRadius,
}: Props): React.JSX.Element {
  const lensOffset = lensRadius * LENS_CENTER_OFFSET
  const halfWidth = lensOffset + lensRadius * (1 + ARM_OVERHANG)
  const barThickness = lensRadius * BAR_THICKNESS

  return (
    <G>
      <Rect
        transform={`translate(${centerX - halfWidth}, ${centerY - barThickness / 2})`}
        width={halfWidth * 2}
        height={barThickness}
        fill="black"
      />
      <Lens cx={centerX - lensOffset} cy={centerY} r={lensRadius} />
      <Lens cx={centerX + lensOffset} cy={centerY} r={lensRadius} />
    </G>
  )
}

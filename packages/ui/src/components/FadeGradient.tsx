import React, {useId} from 'react'
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg'
import {useTheme} from 'tamagui'
import {Stack} from '../primitives'

export interface FadeGradientProps {
  /** Edge where the background is fully opaque; it fades out towards the opposite edge. */
  readonly solidEdge: 'top' | 'bottom'
  /** Fraction of the height, measured from the solid edge, that stays fully opaque. */
  readonly solidFraction?: number
}

/** Fills its parent with a fade between the screen background and transparency. */
export function FadeGradient({
  solidEdge,
  solidFraction = 0,
}: FadeGradientProps): React.JSX.Element {
  const theme = useTheme()
  const gradientId = useId()
  const color = theme.backgroundPrimary.get()
  const [firstStop, secondStop] =
    solidEdge === 'top'
      ? [
          {offset: solidFraction, opacity: 1},
          {offset: 1, opacity: 0},
        ]
      : [
          {offset: 0, opacity: 0},
          {offset: 1 - solidFraction, opacity: 1},
        ]

  return (
    <Stack
      position="absolute"
      top={0}
      right={0}
      bottom={0}
      left={0}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset={firstStop.offset}
              stopColor={color}
              stopOpacity={firstStop.opacity}
            />
            <Stop
              offset={secondStop.offset}
              stopColor={color}
              stopOpacity={secondStop.opacity}
            />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
    </Stack>
  )
}

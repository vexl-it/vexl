import {Stack} from '@vexl-next/ui'
import React from 'react'
import Svg, {Polygon} from 'react-native-svg'

const GRAPHIC_WIDTH = 156
const GRAPHIC_HEIGHT = 145

const GRAPHIC_FILL = '#363636'
const GRAPHIC_OPACITY = 0.25

export function GraphicHeaderDecoration(): React.JSX.Element {
  return (
    <Stack
      position="absolute"
      top={0}
      left={0}
      width={GRAPHIC_WIDTH}
      height={GRAPHIC_HEIGHT}
    >
      <Svg width={GRAPHIC_WIDTH} height={GRAPHIC_HEIGHT} viewBox="0 0 156 145">
        <Polygon
          points="0,6 139,145 0,145"
          fill={GRAPHIC_FILL}
          opacity={GRAPHIC_OPACITY}
        />
        <Polygon
          points="75,0 156,81 75,81"
          fill={GRAPHIC_FILL}
          opacity={GRAPHIC_OPACITY}
        />
      </Svg>
    </Stack>
  )
}

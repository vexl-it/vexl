import React from 'react'
import {StyleSheet} from 'react-native'
import Svg, {Rect} from 'react-native-svg'
import {getTokens, useTheme} from 'tamagui'

import {Camera} from '../icons/Camera'
import {Circle, Stack} from '../primitives'

const BORDER_WIDTH = 1

export interface PhotoPickerPlaceholderProps {
  readonly size: number
  readonly onPress: () => void
}

export function PhotoPickerPlaceholder({
  size,
  onPress,
}: PhotoPickerPlaceholderProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getTokens()
  const radius = tokens.radius.$5.val

  return (
    <Stack
      role="button"
      alignItems="center"
      justifyContent="center"
      width={size}
      height={size}
      pressStyle={{opacity: 0.7}}
      onPress={onPress}
    >
      <Svg
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
      >
        <Rect
          x={BORDER_WIDTH / 2}
          y={BORDER_WIDTH / 2}
          width={size - BORDER_WIDTH}
          height={size - BORDER_WIDTH}
          rx={radius}
          ry={radius}
          fill="none"
          stroke={theme.foregroundTertiary.get()}
          strokeWidth={BORDER_WIDTH}
          strokeDasharray="6 6"
        />
      </Svg>
      <Circle size="$13" backgroundColor="$accentYellowPrimary">
        <Camera size={tokens.size.$9.val} color={theme.black100.get()} />
      </Circle>
    </Stack>
  )
}

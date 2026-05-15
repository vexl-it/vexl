import {CheckboxFilled, SquareOutline, useTheme} from '@vexl-next/ui'
import React, {useEffect} from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

interface Props {
  readonly selected: boolean
}

function AnimatedSelectionCheckboxIcon({selected}: Props): React.ReactElement {
  const theme = useTheme()
  const scale = useSharedValue(1)

  useEffect(() => {
    scale.value = withSequence(
      withTiming(0.86, {duration: 70}),
      withTiming(1.08, {duration: 120}),
      withTiming(1, {duration: 90})
    )
  }, [scale, selected])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }))

  return (
    <Animated.View style={animatedStyle}>
      {selected ? (
        <CheckboxFilled
          size={30}
          color={theme.accentHighlightSecondary.get()}
        />
      ) : (
        <SquareOutline size={30} color={theme.foregroundPrimary.get()} />
      )}
    </Animated.View>
  )
}

export default AnimatedSelectionCheckboxIcon

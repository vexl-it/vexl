import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import type {LayoutChangeEvent} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'
import {getTokens, styled} from 'tamagui'

import {Stack} from '../primitives'

function clampPosition(position: number): number {
  'worklet'
  return Math.max(0, Math.min(1, position))
}

function valueToPosition(value: number, min: number, range: number): number {
  'worklet'
  if (range <= 0) return 0
  return clampPosition((value - min) / range)
}

function positionToValue(
  position: number,
  min: number,
  range: number,
  step: number
): number {
  'worklet'
  const raw = min + clampPosition(position) * range
  return Math.round(raw / step) * step
}

const SliderTrack = styled(Stack, {
  name: 'RadiusSliderTrack',
  position: 'absolute',
  left: '$6',
  right: '$6',
  height: '$1',
  borderRadius: '$8',
  backgroundColor: '$backgroundHighlight',
})

const SliderFill = styled(Stack, {
  name: 'RadiusSliderFill',
  position: 'absolute',
  left: '$6',
  height: '$1',
  borderRadius: '$8',
  backgroundColor: '$accentYellowPrimary',
})

const SliderThumb = styled(Stack, {
  name: 'RadiusSliderThumb',
  position: 'absolute',
  left: 0,
  width: '$9',
  height: '$9',
  borderRadius: '$7',
  backgroundColor: '$accentYellowPrimary',
  borderColor: '$backgroundPrimary',
  alignItems: 'center',
  justifyContent: 'center',
})

const SliderThumbInnerRing = styled(Stack, {
  name: 'RadiusSliderThumbInnerRing',
  width: '$8',
  height: '$8',
  borderRadius: '$5',
  borderWidth: 2,
  borderColor: '$backgroundPrimary',
  backgroundColor: '$accentYellowPrimary',
})

const AnimatedSliderFill = Animated.createAnimatedComponent(SliderFill)
const AnimatedSliderThumb = Animated.createAnimatedComponent(SliderThumb)

export interface RadiusSliderProps {
  readonly min: number
  readonly max: number
  readonly value: number
  readonly onValueChange: (value: number) => void
  readonly step?: number
}

export function RadiusSlider({
  min,
  max,
  value,
  onValueChange,
  step = 1,
}: RadiusSliderProps): React.JSX.Element {
  const tokens = getTokens()
  const thumbSize = tokens.size.$9.val
  const range = max - min

  const [containerWidth, setContainerWidth] = useState(0)
  const usableWidth = useSharedValue(0)
  const initialThumbPosition = valueToPosition(value, min, range)
  const thumbPosition = useSharedValue(initialThumbPosition)
  const dragStartPosition = useSharedValue(initialThumbPosition)
  const lastEmittedValue = useSharedValue(value)
  const isDragging = useRef(false)

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const width = e.nativeEvent.layout.width
      usableWidth.value = Math.max(width - thumbSize, 0)
      setContainerWidth(width)
    },
    [thumbSize, usableWidth]
  )

  useEffect(() => {
    if (isDragging.current) return

    thumbPosition.value = valueToPosition(value, min, range)
    lastEmittedValue.value = value
  }, [lastEmittedValue, min, range, thumbPosition, value])

  const emitValueChange = useCallback(
    (newValue: number): void => {
      onValueChange(newValue)
    },
    [onValueChange]
  )

  const setDragging = useCallback((dragging: boolean): void => {
    isDragging.current = dragging
  }, [])

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onStart((event) => {
          'worklet'
          if (usableWidth.value <= 0) return

          scheduleOnRN(setDragging, true)

          const position = clampPosition(
            (event.x - thumbSize / 2) / usableWidth.value
          )
          thumbPosition.value = position
          dragStartPosition.value = position

          const newValue = positionToValue(position, min, range, step)
          if (newValue === lastEmittedValue.value) return

          lastEmittedValue.value = newValue
          scheduleOnRN(emitValueChange, newValue)
        })
        .onUpdate((event) => {
          'worklet'
          if (usableWidth.value <= 0) return

          const position = clampPosition(
            dragStartPosition.value + event.translationX / usableWidth.value
          )
          thumbPosition.value = position

          const newValue = positionToValue(position, min, range, step)
          if (newValue === lastEmittedValue.value) return

          lastEmittedValue.value = newValue
          scheduleOnRN(emitValueChange, newValue)
        })
        .onFinalize(() => {
          'worklet'
          thumbPosition.value = valueToPosition(
            lastEmittedValue.value,
            min,
            range
          )
          scheduleOnRN(setDragging, false)
        }),
    [
      dragStartPosition,
      emitValueChange,
      lastEmittedValue,
      min,
      range,
      setDragging,
      step,
      thumbPosition,
      thumbSize,
      usableWidth,
    ]
  )

  const fillAnimatedStyle = useAnimatedStyle(() => ({
    width: thumbPosition.value * usableWidth.value + thumbSize / 2,
  }))

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: thumbPosition.value * usableWidth.value}],
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <Stack
        height={thumbSize + tokens.space.$3.val * 2}
        justifyContent="center"
        onLayout={handleLayout}
      >
        <SliderTrack pointerEvents="none" />
        {containerWidth > 0 ? (
          <>
            <AnimatedSliderFill
              pointerEvents="none"
              style={fillAnimatedStyle}
            />
            <AnimatedSliderThumb
              pointerEvents="none"
              style={thumbAnimatedStyle}
            >
              <SliderThumbInnerRing />
            </AnimatedSliderThumb>
          </>
        ) : null}
      </Stack>
    </GestureDetector>
  )
}

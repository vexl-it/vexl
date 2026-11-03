import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {type LayoutChangeEvent, StyleSheet} from 'react-native'
import {GestureDetector, type GestureType} from 'react-native-gesture-handler'
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {getTokens, styled} from 'tamagui'

import {Stack} from '../primitives'

export type SliderScale = 'linear' | 'log'

export interface SliderRange {
  readonly min: number
  readonly max: number
  readonly step: number
  readonly scale: SliderScale
}

export function clampPosition(position: number): number {
  'worklet'
  return Math.max(0, Math.min(1, position))
}

export function valueToPosition(value: number, range: SliderRange): number {
  'worklet'
  const span = range.max - range.min
  if (span <= 0) return 0
  const offset = Math.max(0, Math.min(value - range.min, span))
  return range.scale === 'log'
    ? Math.log(offset + 1) / Math.log(span + 1)
    : offset / span
}

export function positionToValue(position: number, range: SliderRange): number {
  'worklet'
  const span = range.max - range.min
  if (span <= 0) return range.min
  const clamped = clampPosition(position)
  const offset =
    range.scale === 'log'
      ? Math.exp(clamped * Math.log(span + 1)) - 1
      : clamped * span
  return Math.round((range.min + offset) / range.step) * range.step
}

const SliderTrack = styled(Stack, {
  name: 'SliderTrack',
  position: 'absolute',
  left: '$6',
  right: '$6',
  height: '$2',
  borderRadius: '$8',
  backgroundColor: '$backgroundHighlight',
})

const SliderActiveTrackFrame = styled(Stack, {
  name: 'SliderActiveTrack',
  height: '$2',
  borderRadius: '$8',
  backgroundColor: '$accentYellowPrimary',
})

const SliderThumbFrame = styled(Stack, {
  name: 'SliderThumb',
  width: '$9',
  height: '$9',
  borderRadius: '$7',
  backgroundColor: '$accentYellowPrimary',
  alignItems: 'center',
  justifyContent: 'center',
})

const SliderThumbInnerRing = styled(Stack, {
  name: 'SliderThumbInnerRing',
  width: '$8',
  height: '$8',
  borderRadius: '$5',
  borderWidth: 2,
  borderColor: '$backgroundPrimary',
  backgroundColor: '$accentYellowPrimary',
})

const styles = StyleSheet.create({
  activeTrack: {position: 'absolute', pointerEvents: 'none'},
  thumb: {position: 'absolute', left: 0, pointerEvents: 'none'},
})

export interface SliderLayout {
  readonly thumbSize: number
  readonly hasLayout: boolean
  readonly containerWidth: SharedValue<number>
  readonly usableWidth: SharedValue<number>
  readonly onLayout: (event: LayoutChangeEvent) => void
}

export function useSliderLayout(): SliderLayout {
  const thumbSize = getTokens().size.$9.val
  const [hasLayout, setHasLayout] = useState(false)
  const containerWidth = useSharedValue(0)
  const usableWidth = useSharedValue(0)

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width
      containerWidth.value = width
      usableWidth.value = Math.max(width - thumbSize, 0)
      setHasLayout(width > 0)
    },
    [containerWidth, thumbSize, usableWidth]
  )

  return useMemo(
    () => ({thumbSize, hasLayout, containerWidth, usableWidth, onLayout}),
    [containerWidth, hasLayout, onLayout, thumbSize, usableWidth]
  )
}

export interface SliderThumbState {
  readonly position: SharedValue<number>
  readonly lastEmittedValue: SharedValue<number>
}

/** Keeps the thumb in sync with `value` unless the user is dragging. */
export function useSliderThumbState(
  value: number,
  range: SliderRange,
  isDragging: React.RefObject<boolean>
): SliderThumbState {
  const position = useSharedValue(valueToPosition(value, range))
  const lastEmittedValue = useSharedValue(value)
  const {min, max, step, scale} = range

  useEffect(() => {
    if (isDragging.current) return

    position.value = valueToPosition(value, {min, max, step, scale})
    lastEmittedValue.value = value
  }, [isDragging, lastEmittedValue, max, min, position, scale, step, value])

  return useMemo(
    () => ({position, lastEmittedValue}),
    [lastEmittedValue, position]
  )
}

export function SliderContainer({
  gesture,
  layout,
  children,
}: {
  readonly gesture: GestureType
  readonly layout: SliderLayout
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <GestureDetector gesture={gesture}>
      <Stack
        height={layout.thumbSize + getTokens().space.$3.val * 2}
        justifyContent="center"
        onLayout={layout.onLayout}
      >
        <SliderTrack pointerEvents="none" />
        {layout.hasLayout ? children : null}
      </Stack>
    </GestureDetector>
  )
}

export function SliderThumb({
  position,
  layout,
}: {
  readonly position: SharedValue<number>
  readonly layout: SliderLayout
}): React.JSX.Element {
  const {usableWidth} = layout
  const style = useAnimatedStyle(() => ({
    transform: [{translateX: position.value * usableWidth.value}],
  }))

  return (
    <Animated.View style={[styles.thumb, style]}>
      <SliderThumbFrame>
        <SliderThumbInnerRing />
      </SliderThumbFrame>
    </Animated.View>
  )
}

export function SliderActiveTrack({
  from,
  to,
  layout,
}: {
  readonly from?: SharedValue<number>
  readonly to: SharedValue<number>
  readonly layout: SliderLayout
}): React.JSX.Element {
  const {containerWidth, usableWidth, thumbSize} = layout
  const halfThumb = thumbSize / 2
  const style = useAnimatedStyle(() => ({
    left: (from?.value ?? 0) * usableWidth.value + halfThumb,
    right: containerWidth.value - (to.value * usableWidth.value + halfThumb),
  }))

  return (
    <Animated.View style={[styles.activeTrack, style]}>
      <SliderActiveTrackFrame />
    </Animated.View>
  )
}

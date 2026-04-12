import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import type {LayoutChangeEvent} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'
import {getTokens, styled} from 'tamagui'

import {Stack} from '../../primitives'

const NO_ACTIVE_THUMB = 0
const MIN_ACTIVE_THUMB = 1
const MAX_ACTIVE_THUMB = 2

function clampPosition(position: number): number {
  'worklet'
  return Math.max(0, Math.min(1, position))
}

function valueToPosition(value: number, max: number): number {
  'worklet'
  if (max <= 0) return 0
  const safeValue = Math.max(0, Math.min(value, max))
  return Math.log(safeValue + 1) / Math.log(max + 1)
}

function positionToValue(position: number, max: number): number {
  'worklet'
  if (max <= 0) return 0
  return Math.round(Math.exp(clampPosition(position) * Math.log(max + 1)) - 1)
}

const SliderTrack = styled(Stack, {
  name: 'RangeSliderTrack',
  position: 'absolute',
  left: '$6',
  right: '$6',
  height: '$2',
  borderRadius: '$8',
  backgroundColor: '$backgroundHighlight',
})

const SliderActiveTrack = styled(Stack, {
  name: 'RangeSliderActiveTrack',
  position: 'absolute',
  height: '$2',
  borderRadius: '$8',
  backgroundColor: '$accentYellowPrimary',
})

const SliderThumb = styled(Stack, {
  name: 'RangeSliderThumb',
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
  name: 'RangeSliderThumbInnerRing',
  width: '$8',
  height: '$8',
  borderRadius: '$5',
  borderWidth: 2,
  borderColor: '$backgroundPrimary',
  backgroundColor: '$accentYellowPrimary',
})

const AnimatedSliderActiveTrack =
  Animated.createAnimatedComponent(SliderActiveTrack)
const AnimatedSliderThumb = Animated.createAnimatedComponent(SliderThumb)

export interface RangeSliderProps {
  readonly minValueAtom: WritableAtom<number, [SetStateAction<number>], void>
  readonly maxValueAtom: WritableAtom<number, [SetStateAction<number>], void>
  readonly maxLimit: number
  readonly onInteractionStart?: () => void
}

export function RangeSlider({
  minValueAtom,
  maxValueAtom,
  maxLimit,
  onInteractionStart,
}: RangeSliderProps): React.JSX.Element {
  const [minValue, setMinValue] = useAtom(minValueAtom)
  const [maxValue, setMaxValue] = useAtom(maxValueAtom)
  const tokens = getTokens()

  const thumbSize = tokens.size['9'].val

  const [containerWidth, setContainerWidth] = useState(0)
  const containerWidthValue = useSharedValue(0)
  const usableWidth = useSharedValue(0)
  const activeThumb = useSharedValue(NO_ACTIVE_THUMB)
  const dragStartPosition = useSharedValue(0)
  const minPosition = useSharedValue(valueToPosition(minValue, maxLimit))
  const maxPosition = useSharedValue(valueToPosition(maxValue, maxLimit))
  const lastEmittedMinValue = useSharedValue(minValue)
  const lastEmittedMaxValue = useSharedValue(maxValue)
  const isDragging = useRef(false)
  const halfThumb = thumbSize / 2

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const width = e.nativeEvent.layout.width
      containerWidthValue.value = width
      usableWidth.value = Math.max(width - thumbSize, 0)
      setContainerWidth(width)
    },
    [containerWidthValue, thumbSize, usableWidth]
  )

  useEffect(() => {
    if (isDragging.current) return

    minPosition.value = valueToPosition(minValue, maxLimit)
    lastEmittedMinValue.value = minValue
  }, [lastEmittedMinValue, maxLimit, minPosition, minValue])

  useEffect(() => {
    if (isDragging.current) return

    maxPosition.value = valueToPosition(maxValue, maxLimit)
    lastEmittedMaxValue.value = maxValue
  }, [lastEmittedMaxValue, maxLimit, maxPosition, maxValue])

  const emitMinValueChange = useCallback(
    (newValue: number): void => {
      setMinValue(newValue)
    },
    [setMinValue]
  )

  const emitMaxValueChange = useCallback(
    (newValue: number): void => {
      setMaxValue(newValue)
    },
    [setMaxValue]
  )

  const emitInteractionStart = useCallback((): void => {
    onInteractionStart?.()
  }, [onInteractionStart])

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

          scheduleOnRN(emitInteractionStart)
          scheduleOnRN(setDragging, true)

          const touchPosition = clampPosition(
            (event.x - halfThumb) / usableWidth.value
          )

          if (
            Math.abs(touchPosition - minPosition.value) <=
            Math.abs(touchPosition - maxPosition.value)
          ) {
            activeThumb.value = MIN_ACTIVE_THUMB
            dragStartPosition.value = minPosition.value
          } else {
            activeThumb.value = MAX_ACTIVE_THUMB
            dragStartPosition.value = maxPosition.value
          }
        })
        .onUpdate((event) => {
          'worklet'
          if (usableWidth.value <= 0) return

          const position = clampPosition(
            dragStartPosition.value + event.translationX / usableWidth.value
          )

          if (activeThumb.value === MIN_ACTIVE_THUMB) {
            const nextPosition = Math.min(position, maxPosition.value)
            minPosition.value = nextPosition

            const newValue = positionToValue(nextPosition, maxLimit)
            if (newValue === lastEmittedMinValue.value) return

            lastEmittedMinValue.value = newValue
            scheduleOnRN(emitMinValueChange, newValue)
            return
          }

          if (activeThumb.value === MAX_ACTIVE_THUMB) {
            const nextPosition = Math.max(position, minPosition.value)
            maxPosition.value = nextPosition

            const newValue = positionToValue(nextPosition, maxLimit)
            if (newValue === lastEmittedMaxValue.value) return

            lastEmittedMaxValue.value = newValue
            scheduleOnRN(emitMaxValueChange, newValue)
          }
        })
        .onFinalize(() => {
          'worklet'

          if (activeThumb.value === MIN_ACTIVE_THUMB) {
            minPosition.value = valueToPosition(
              lastEmittedMinValue.value,
              maxLimit
            )
          }

          if (activeThumb.value === MAX_ACTIVE_THUMB) {
            maxPosition.value = valueToPosition(
              lastEmittedMaxValue.value,
              maxLimit
            )
          }

          activeThumb.value = NO_ACTIVE_THUMB
          scheduleOnRN(setDragging, false)
        }),
    [
      activeThumb,
      dragStartPosition,
      emitInteractionStart,
      emitMaxValueChange,
      emitMinValueChange,
      halfThumb,
      lastEmittedMaxValue,
      lastEmittedMinValue,
      maxLimit,
      maxPosition,
      minPosition,
      setDragging,
      usableWidth,
    ]
  )

  const activeTrackAnimatedStyle = useAnimatedStyle(() => ({
    left: minPosition.value * usableWidth.value + halfThumb,
    right:
      containerWidthValue.value -
      (maxPosition.value * usableWidth.value + halfThumb),
  }))

  const minThumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: minPosition.value * usableWidth.value}],
  }))

  const maxThumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: maxPosition.value * usableWidth.value}],
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <Stack
        height={thumbSize + tokens.space['3'].val * 2}
        justifyContent="center"
        onLayout={handleLayout}
      >
        <SliderTrack pointerEvents="none" />
        {containerWidth > 0 ? (
          <>
            <AnimatedSliderActiveTrack
              pointerEvents="none"
              style={activeTrackAnimatedStyle}
            />
            <AnimatedSliderThumb
              pointerEvents="none"
              style={minThumbAnimatedStyle}
            >
              <SliderThumbInnerRing />
            </AnimatedSliderThumb>
            <AnimatedSliderThumb
              pointerEvents="none"
              style={maxThumbAnimatedStyle}
            >
              <SliderThumbInnerRing />
            </AnimatedSliderThumb>
          </>
        ) : null}
      </Stack>
    </GestureDetector>
  )
}

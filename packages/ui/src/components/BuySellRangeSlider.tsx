import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import type {LayoutChangeEvent} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'
import {getTokens, styled} from 'tamagui'

import {Stack, XStack, YStack} from '../primitives'
import {InfoBox, type InfoBoxVariant} from './InfoBox'
import {Typography} from './Typography'

function clampPosition(position: number): number {
  'worklet'
  return Math.max(0, Math.min(1, position))
}

function valueToPosition(value: number, min: number, range: number): number {
  'worklet'
  if (range <= 0) return 0
  return clampPosition((value - min) / range)
}

function positionToValue(position: number, min: number, range: number): number {
  'worklet'
  return Math.round(min + clampPosition(position) * range)
}

const SliderTrack = styled(Stack, {
  name: 'BuySellRangeSliderTrack',
  position: 'absolute',
  left: '$6',
  right: '$6',
  height: '$2',
  borderRadius: '$8',
  backgroundColor: '$backgroundHighlight',
})

const SliderThumb = styled(Stack, {
  name: 'BuySellRangeSliderThumb',
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
  name: 'BuySellRangeSliderThumbInnerRing',
  width: '$8',
  height: '$8',
  borderRadius: '$5',
  borderWidth: 2,
  borderColor: '$backgroundPrimary',
  backgroundColor: '$accentYellowPrimary',
})

const AnimatedSliderThumb = Animated.createAnimatedComponent(SliderThumb)

export interface BuySellRangeSliderProps {
  readonly leftLabel: string
  readonly rightLabel: string
  readonly minPercentage: number
  readonly maxPercentage: number
  readonly percentage: number
  readonly onPercentageChange: (percentage: number) => void
  readonly infoText: string
  readonly amountText: string
}

export function BuySellRangeSlider({
  leftLabel,
  rightLabel,
  minPercentage,
  maxPercentage,
  percentage,
  onPercentageChange,
  infoText,
  amountText,
}: BuySellRangeSliderProps): React.JSX.Element {
  const tokens = getTokens()
  const thumbSize = tokens.size.$9.val
  const range = maxPercentage - minPercentage
  const midPercentage = (minPercentage + maxPercentage) / 2
  const distanceFromCenter = Math.abs(percentage - midPercentage)
  const quarterRange = range / 4

  const [containerWidth, setContainerWidth] = useState(0)
  const usableWidth = useSharedValue(0)
  const initialThumbPosition = valueToPosition(percentage, minPercentage, range)
  const thumbPosition = useSharedValue(initialThumbPosition)
  const dragStartPosition = useSharedValue(initialThumbPosition)
  const lastEmittedValue = useSharedValue(percentage)
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

    thumbPosition.value = valueToPosition(percentage, minPercentage, range)
    lastEmittedValue.value = percentage
  }, [lastEmittedValue, minPercentage, percentage, range, thumbPosition])

  const emitPercentageChange = useCallback(
    (newValue: number): void => {
      onPercentageChange(newValue)
    },
    [onPercentageChange]
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

          const newValue = positionToValue(position, minPercentage, range)
          if (newValue === lastEmittedValue.value) return

          lastEmittedValue.value = newValue
          scheduleOnRN(emitPercentageChange, newValue)
        })
        .onUpdate((event) => {
          'worklet'
          if (usableWidth.value <= 0) return

          const position = clampPosition(
            dragStartPosition.value + event.translationX / usableWidth.value
          )
          thumbPosition.value = position

          const newValue = positionToValue(position, minPercentage, range)
          if (newValue === lastEmittedValue.value) return

          lastEmittedValue.value = newValue
          scheduleOnRN(emitPercentageChange, newValue)
        })
        .onFinalize(() => {
          'worklet'
          thumbPosition.value = valueToPosition(
            lastEmittedValue.value,
            minPercentage,
            range
          )
          scheduleOnRN(setDragging, false)
        }),
    [
      dragStartPosition,
      emitPercentageChange,
      lastEmittedValue,
      minPercentage,
      range,
      setDragging,
      thumbPosition,
      thumbSize,
      usableWidth,
    ]
  )

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: thumbPosition.value * usableWidth.value}],
  }))

  const bannerVariant: InfoBoxVariant =
    distanceFromCenter === 0
      ? 'gray'
      : distanceFromCenter <= quarterRange
        ? 'yellow'
        : 'pink'

  return (
    <YStack gap="$3">
      <Stack gap="$3" paddingHorizontal="$2">
        <XStack justifyContent="space-between">
          <Typography variant="micro" color="$foregroundPrimary">
            {leftLabel}
          </Typography>
          <Typography variant="micro" color="$foregroundPrimary">
            {rightLabel}
          </Typography>
        </XStack>
        <GestureDetector gesture={panGesture}>
          <Stack
            height={thumbSize + tokens.space.$3.val * 2}
            justifyContent="center"
            onLayout={handleLayout}
          >
            <SliderTrack pointerEvents="none" />
            {containerWidth > 0 ? (
              <AnimatedSliderThumb
                pointerEvents="none"
                style={thumbAnimatedStyle}
              >
                <SliderThumbInnerRing />
              </AnimatedSliderThumb>
            ) : null}
          </Stack>
        </GestureDetector>
        {amountText.length > 0 ? (
          <XStack justifyContent="center" padding="$4">
            <Typography variant="micro" color="$foregroundSecondary">
              {amountText}
            </Typography>
          </XStack>
        ) : null}
      </Stack>
      <InfoBox variant={bannerVariant} iconSize={24} p="$5" gap="$3" textMt={0}>
        {infoText}
      </InfoBox>
    </YStack>
  )
}

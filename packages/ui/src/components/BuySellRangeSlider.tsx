import React, {useCallback, useMemo, useRef, useState} from 'react'
import type {GestureResponderEvent, LayoutChangeEvent} from 'react-native'
import {PanResponder} from 'react-native'
import {getTokens, styled, useTheme} from 'tamagui'

import {InfoCircle} from '../icons/InfoCircle'
import {Stack, XStack, YStack} from '../primitives'
import {Typography} from './Typography'

function getTouchPosition(
  evt: GestureResponderEvent,
  thumbSize: number,
  usableWidth: number
): number {
  const touchX = evt.nativeEvent.locationX - thumbSize / 2
  return usableWidth > 0 ? touchX / usableWidth : 0
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

const InfoBanner = styled(XStack, {
  name: 'BuySellRangeSliderInfoBanner',
  alignItems: 'center',
  padding: '$5',
  borderRadius: '$3',
  gap: '$3',
  variants: {
    variant: {
      gray: {
        backgroundColor: '$backgroundSecondary',
      },
      yellow: {
        backgroundColor: '$accentYellowSecondary',
      },
      pink: {
        backgroundColor: '$pinkBackground',
      },
    },
  } as const,
  defaultVariants: {
    variant: 'gray',
  },
})

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
  const theme = useTheme()
  const thumbSize = tokens.size.$9.val
  const range = maxPercentage - minPercentage
  const midPercentage = (minPercentage + maxPercentage) / 2
  const distanceFromCenter = Math.abs(percentage - midPercentage)
  const quarterRange = range / 4

  const [containerWidth, setContainerWidth] = useState(0)
  const containerWidthRef = useRef(0)
  const startPosRef = useRef(0)
  const valueRef = useRef(percentage)
  valueRef.current = percentage

  const usableWidth = Math.max(containerWidth - thumbSize, 0)

  const valueToPosition = useCallback(
    (v: number): number => {
      if (range <= 0) return 0
      return Math.max(0, Math.min(1, (v - minPercentage) / range))
    },
    [minPercentage, range]
  )

  const positionToValue = useCallback(
    (position: number): number => {
      const clamped = Math.max(0, Math.min(1, position))
      return Math.round(minPercentage + clamped * range)
    },
    [minPercentage, range]
  )

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width
    if (width === containerWidthRef.current) return

    containerWidthRef.current = width
    setContainerWidth(width)
  }, [])

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const width = containerWidthRef.current - thumbSize
          if (width <= 0) return

          startPosRef.current = valueToPosition(valueRef.current)
          const touchPos = getTouchPosition(evt, thumbSize, width)

          const newValue = positionToValue(touchPos)
          onPercentageChange(newValue)
        },
        onPanResponderMove: (_evt, gestureState) => {
          const width = containerWidthRef.current - thumbSize
          if (width <= 0) return
          const position = Math.max(
            0,
            Math.min(1, startPosRef.current + gestureState.dx / width)
          )
          onPercentageChange(positionToValue(position))
        },
        onPanResponderRelease: () => {},
        onPanResponderTerminate: () => {},
      }),
    [thumbSize, valueToPosition, positionToValue, onPercentageChange]
  )

  const currentPos = valueToPosition(percentage)
  const thumbLeft = currentPos * usableWidth
  const bannerVariant =
    distanceFromCenter === 0
      ? 'gray'
      : distanceFromCenter <= quarterRange
        ? 'yellow'
        : 'pink'
  const infoColor =
    bannerVariant === 'gray'
      ? theme.foregroundSecondary.val
      : bannerVariant === 'yellow'
        ? theme.accentHighlightSecondary.val
        : theme.pinkForeground.val

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
        <Stack
          height={thumbSize + tokens.space.$3.val * 2}
          justifyContent="center"
          onLayout={handleLayout}
          {...panResponder.panHandlers}
        >
          <SliderTrack pointerEvents="none" />
          {containerWidth > 0 ? (
            <SliderThumb pointerEvents="none" left={thumbLeft}>
              <SliderThumbInnerRing />
            </SliderThumb>
          ) : null}
        </Stack>
        <XStack justifyContent="center" padding="$4">
          <Typography variant="micro" color="$foregroundSecondary">
            {amountText}
          </Typography>
        </XStack>
      </Stack>
      <InfoBanner variant={bannerVariant}>
        <InfoCircle size={24} color={infoColor} />
        <Typography variant="description" color={infoColor} flex={1}>
          {infoText}
        </Typography>
      </InfoBanner>
    </YStack>
  )
}

import React, {useCallback, useMemo, useRef, useState} from 'react'
import type {GestureResponderEvent, LayoutChangeEvent} from 'react-native'
import {PanResponder} from 'react-native'
import {getTokens, styled} from 'tamagui'

import {Stack} from '../primitives'

function getTouchPosition(
  evt: GestureResponderEvent,
  thumbSize: number,
  usableWidth: number
): number {
  const touchX = evt.nativeEvent.locationX - thumbSize / 2
  return usableWidth > 0 ? touchX / usableWidth : 0
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
  const containerWidthRef = useRef(0)
  const startPosRef = useRef(0)
  const valueRef = useRef(value)
  valueRef.current = value

  const usableWidth = Math.max(containerWidth - thumbSize, 0)

  const valueToPosition = useCallback(
    (v: number): number => {
      if (range <= 0) return 0
      return Math.max(0, Math.min(1, (v - min) / range))
    },
    [min, range]
  )

  const positionToValue = useCallback(
    (position: number): number => {
      const clamped = Math.max(0, Math.min(1, position))
      const raw = min + clamped * range
      return Math.round(raw / step) * step
    },
    [min, range, step]
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
          onValueChange(positionToValue(touchPos))
        },
        onPanResponderMove: (_evt, gestureState) => {
          const width = containerWidthRef.current - thumbSize
          if (width <= 0) return
          const position = Math.max(
            0,
            Math.min(1, startPosRef.current + gestureState.dx / width)
          )
          onValueChange(positionToValue(position))
        },
        onPanResponderRelease: () => {},
        onPanResponderTerminate: () => {},
      }),
    [thumbSize, valueToPosition, positionToValue, onValueChange]
  )

  const currentPos = valueToPosition(value)
  const thumbLeft = currentPos * usableWidth
  const fillWidth = thumbLeft + thumbSize / 2

  return (
    <Stack
      height={thumbSize + tokens.space.$3.val * 2}
      justifyContent="center"
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      <SliderTrack pointerEvents="none" />
      {containerWidth > 0 ? (
        <>
          <SliderFill pointerEvents="none" width={fillWidth} />
          <SliderThumb pointerEvents="none" left={thumbLeft}>
            <SliderThumbInnerRing />
          </SliderThumb>
        </>
      ) : null}
    </Stack>
  )
}

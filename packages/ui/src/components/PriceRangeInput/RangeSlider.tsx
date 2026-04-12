import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import type {GestureResponderEvent, LayoutChangeEvent, View} from 'react-native'
import {PanResponder} from 'react-native'
import {getTokens, styled} from 'tamagui'

import {Stack} from '../../primitives'

function valueToPosition(value: number, max: number): number {
  if (max <= 0) return 0
  const safeValue = Math.max(0, Math.min(value, max))
  return Math.log(safeValue + 1) / Math.log(max + 1)
}

function positionToValue(position: number, max: number): number {
  if (max <= 0) return 0
  const clamped = Math.max(0, Math.min(1, position))
  return Math.round(Math.exp(clamped * Math.log(max + 1)) - 1)
}

function getTouchPosition(
  evt: GestureResponderEvent,
  containerPageX: number,
  thumbSize: number,
  usableWidth: number
): number {
  const touchX = evt.nativeEvent.pageX - containerPageX - thumbSize / 2
  return usableWidth > 0 ? touchX / usableWidth : 0
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
  const containerWidthRef = useRef(0)
  const containerPageXRef = useRef(0)
  const viewRef = useRef<View>(null)
  const activeThumb = useRef<'min' | 'max' | null>(null)
  const startThumbPosRef = useRef(0)
  const dragPositionRef = useRef<number | null>(null)
  const minValueRef = useRef(minValue)
  const maxValueRef = useRef(maxValue)
  minValueRef.current = minValue
  maxValueRef.current = maxValue

  const usableWidth = Math.max(containerWidth - thumbSize, 0)
  const halfThumb = thumbSize / 2

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width
    containerWidthRef.current = width
    setContainerWidth(width)
    viewRef.current?.measureInWindow((pageX) => {
      containerPageXRef.current = pageX
    })
  }, [])

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const width = containerWidthRef.current - thumbSize
          if (width <= 0) return

          onInteractionStart?.()

          viewRef.current?.measureInWindow((pageX) => {
            containerPageXRef.current = pageX
          })

          const touchPos = getTouchPosition(
            evt,
            containerPageXRef.current,
            thumbSize,
            width
          )
          const currentMinPos = valueToPosition(minValueRef.current, maxLimit)
          const currentMaxPos = valueToPosition(maxValueRef.current, maxLimit)

          if (
            Math.abs(touchPos - currentMinPos) <=
            Math.abs(touchPos - currentMaxPos)
          ) {
            activeThumb.current = 'min'
            startThumbPosRef.current = currentMinPos
          } else {
            activeThumb.current = 'max'
            startThumbPosRef.current = currentMaxPos
          }
        },
        onPanResponderMove: (_evt, gestureState) => {
          const width = containerWidthRef.current - thumbSize
          if (width <= 0 || activeThumb.current == null) return
          const position = Math.max(
            0,
            Math.min(1, startThumbPosRef.current + gestureState.dx / width)
          )
          dragPositionRef.current = position
          const value = positionToValue(position, maxLimit)
          if (activeThumb.current === 'min') {
            setMinValue(Math.min(value, maxValueRef.current))
          } else {
            setMaxValue(Math.max(value, minValueRef.current))
          }
        },
        onPanResponderRelease: () => {
          dragPositionRef.current = null
          activeThumb.current = null
        },
        onPanResponderTerminate: () => {
          dragPositionRef.current = null
          activeThumb.current = null
        },
      }),
    [thumbSize, maxLimit, setMinValue, setMaxValue, onInteractionStart]
  )

  const minPos =
    activeThumb.current === 'min' && dragPositionRef.current != null
      ? dragPositionRef.current
      : valueToPosition(minValue, maxLimit)
  const maxPos =
    activeThumb.current === 'max' && dragPositionRef.current != null
      ? dragPositionRef.current
      : valueToPosition(maxValue, maxLimit)
  const minThumbLeft = minPos * usableWidth
  const maxThumbLeft = maxPos * usableWidth

  return (
    <Stack
      ref={viewRef}
      height={thumbSize + tokens.space['3'].val * 2}
      justifyContent="center"
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      <SliderTrack pointerEvents="none" />
      {containerWidth > 0 ? (
        <>
          <SliderActiveTrack
            pointerEvents="none"
            left={minThumbLeft + halfThumb}
            right={containerWidth - (maxThumbLeft + halfThumb)}
          />
          <SliderThumb pointerEvents="none" left={minThumbLeft}>
            <SliderThumbInnerRing />
          </SliderThumb>
          <SliderThumb pointerEvents="none" left={maxThumbLeft}>
            <SliderThumbInnerRing />
          </SliderThumb>
        </>
      ) : null}
    </Stack>
  )
}

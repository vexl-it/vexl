import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React, {useCallback, useMemo, useRef} from 'react'
import {Gesture} from 'react-native-gesture-handler'
import {useSharedValue} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'

import {
  SliderActiveTrack,
  SliderContainer,
  type SliderRange,
  SliderThumb,
  type SliderThumbState,
  clampPosition,
  positionToValue,
  useSliderLayout,
  useSliderThumbState,
  valueToPosition,
} from '../SliderPrimitives'

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
  const range: SliderRange = useMemo(
    () => ({min: 0, max: maxLimit, step: 1, scale: 'log'}),
    [maxLimit]
  )

  const layout = useSliderLayout()
  const isDragging = useRef(false)
  const minThumb = useSliderThumbState(minValue, range, isDragging)
  const maxThumb = useSliderThumbState(maxValue, range, isDragging)
  const activeThumb = useSharedValue<'min' | 'max' | null>(null)
  const dragStartPosition = useSharedValue(0)

  const emitInteractionStart = useCallback((): void => {
    onInteractionStart?.()
  }, [onInteractionStart])

  const setDragging = useCallback((dragging: boolean): void => {
    isDragging.current = dragging
  }, [])

  const gesture = useMemo(() => {
    const {usableWidth, thumbSize} = layout

    const moveThumb = (
      thumb: SliderThumbState,
      nextPosition: number,
      emit: (value: number) => void
    ): void => {
      'worklet'
      thumb.position.value = nextPosition
      const newValue = positionToValue(nextPosition, range)
      if (newValue === thumb.lastEmittedValue.value) return

      thumb.lastEmittedValue.value = newValue
      scheduleOnRN(emit, newValue)
    }

    return Gesture.Pan()
      .minDistance(0)
      .onStart((event) => {
        'worklet'
        if (usableWidth.value <= 0) return

        scheduleOnRN(emitInteractionStart)
        scheduleOnRN(setDragging, true)

        const touchPosition = clampPosition(
          (event.x - thumbSize / 2) / usableWidth.value
        )
        const isMinCloser =
          Math.abs(touchPosition - minThumb.position.value) <=
          Math.abs(touchPosition - maxThumb.position.value)

        activeThumb.value = isMinCloser ? 'min' : 'max'
        dragStartPosition.value = isMinCloser
          ? minThumb.position.value
          : maxThumb.position.value
      })
      .onUpdate((event) => {
        'worklet'
        if (usableWidth.value <= 0 || activeThumb.value === null) return

        const position = clampPosition(
          dragStartPosition.value + event.translationX / usableWidth.value
        )

        if (activeThumb.value === 'min') {
          moveThumb(
            minThumb,
            Math.min(position, maxThumb.position.value),
            setMinValue
          )
        } else {
          moveThumb(
            maxThumb,
            Math.max(position, minThumb.position.value),
            setMaxValue
          )
        }
      })
      .onFinalize(() => {
        'worklet'
        const thumb =
          activeThumb.value === 'min'
            ? minThumb
            : activeThumb.value === 'max'
              ? maxThumb
              : null
        if (thumb !== null) {
          thumb.position.value = valueToPosition(
            thumb.lastEmittedValue.value,
            range
          )
        }

        activeThumb.value = null
        scheduleOnRN(setDragging, false)
      })
  }, [
    activeThumb,
    dragStartPosition,
    emitInteractionStart,
    layout,
    maxThumb,
    minThumb,
    range,
    setDragging,
    setMaxValue,
    setMinValue,
  ])

  return (
    <SliderContainer gesture={gesture} layout={layout}>
      <SliderActiveTrack
        from={minThumb.position}
        to={maxThumb.position}
        layout={layout}
      />
      <SliderThumb position={minThumb.position} layout={layout} />
      <SliderThumb position={maxThumb.position} layout={layout} />
    </SliderContainer>
  )
}

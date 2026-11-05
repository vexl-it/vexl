import React, {useCallback, useMemo, useRef} from 'react'
import {Gesture} from 'react-native-gesture-handler'
import {useSharedValue} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'

import {
  SliderActiveTrack,
  SliderContainer,
  type SliderScale,
  SliderThumb,
  clampPosition,
  positionToValue,
  useSliderLayout,
  useSliderThumbState,
  valueToPosition,
} from './SliderPrimitives'

export interface SliderProps {
  readonly min: number
  readonly max: number
  readonly value: number
  readonly onValueChange: (value: number) => void
  readonly step?: number
  readonly scale?: SliderScale
  /** Highlights the track between the start and the thumb. */
  readonly filled?: boolean
}

export function Slider({
  min,
  max,
  value,
  onValueChange,
  step = 1,
  scale = 'linear',
  filled = false,
}: SliderProps): React.JSX.Element {
  const layout = useSliderLayout()
  const isDragging = useRef(false)
  const range = useMemo(
    () => ({min, max, step, scale}),
    [max, min, scale, step]
  )
  const thumb = useSliderThumbState(value, range, isDragging)
  const dragStartPosition = useSharedValue(0)

  const setDragging = useCallback((dragging: boolean): void => {
    isDragging.current = dragging
  }, [])

  const gesture = useMemo(() => {
    const {usableWidth, thumbSize} = layout
    const {position, lastEmittedValue} = thumb

    const moveTo = (nextPosition: number): void => {
      'worklet'
      position.value = nextPosition
      const newValue = positionToValue(nextPosition, range)
      if (newValue === lastEmittedValue.value) return

      lastEmittedValue.value = newValue
      scheduleOnRN(onValueChange, newValue)
    }

    return Gesture.Pan()
      .minDistance(0)
      .onStart((event) => {
        'worklet'
        if (usableWidth.value <= 0) return

        scheduleOnRN(setDragging, true)
        const touchPosition = clampPosition(
          (event.x - thumbSize / 2) / usableWidth.value
        )
        dragStartPosition.value = touchPosition
        moveTo(touchPosition)
      })
      .onUpdate((event) => {
        'worklet'
        if (usableWidth.value <= 0) return

        moveTo(
          clampPosition(
            dragStartPosition.value + event.translationX / usableWidth.value
          )
        )
      })
      .onFinalize(() => {
        'worklet'
        position.value = valueToPosition(lastEmittedValue.value, range)
        scheduleOnRN(setDragging, false)
      })
  }, [dragStartPosition, layout, onValueChange, range, setDragging, thumb])

  return (
    <SliderContainer gesture={gesture} layout={layout}>
      {filled ? (
        <SliderActiveTrack to={thumb.position} layout={layout} />
      ) : null}
      <SliderThumb position={thumb.position} layout={layout} />
    </SliderContainer>
  )
}

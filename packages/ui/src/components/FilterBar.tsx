import React, {useCallback, useRef} from 'react'
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView as RNScrollView,
} from 'react-native'
import {ScrollView} from 'react-native'
import {getTokens} from 'tamagui'

import {XStack} from '../primitives'
import {FilterTag} from './FilterTag'

export interface FilterBarItem<T> {
  readonly label: string
  readonly value: T
}

export interface FilterBarProps<T> {
  readonly items: ReadonlyArray<FilterBarItem<T>>
  readonly selectedValues: ReadonlySet<T>
  readonly onSelectedValuesChange: (values: ReadonlySet<T>) => void
}

interface TagLayout {
  readonly x: number
  readonly width: number
}

export function FilterBar<T>({
  items,
  selectedValues,
  onSelectedValuesChange,
}: FilterBarProps<T>): React.JSX.Element {
  const spaceTokens = getTokens().space

  const gap = spaceTokens.$3.val

  const scrollViewRef = useRef<RNScrollView>(null)
  const scrollViewWidth = useRef(0)
  const scrollOffset = useRef(0)
  const tagLayouts = useRef<TagLayout[]>([])

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffset.current = event.nativeEvent.contentOffset.x
    },
    []
  )

  const handleTagLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const {x, width} = event.nativeEvent.layout
      tagLayouts.current[index] = {x, width}
    },
    []
  )

  const scrollToReveal = useCallback(
    (index: number) => {
      const layout = tagLayouts.current[index]
      if (!layout || !scrollViewRef.current) return

      const viewWidth = scrollViewWidth.current
      const offset = scrollOffset.current
      const tagLeft = layout.x
      const tagRight = layout.x + layout.width

      const nextLayout = tagLayouts.current[index + 1]
      const peekExtra = nextLayout
        ? gap + Math.min(nextLayout.width, nextLayout.width * 0.5 + gap)
        : 0

      if (tagRight + peekExtra > offset + viewWidth) {
        scrollViewRef.current.scrollTo({
          x: tagRight + peekExtra - viewWidth,
          animated: true,
        })
      } else if (tagLeft < offset) {
        const prevLayout = tagLayouts.current[index - 1]
        const peekBefore = prevLayout
          ? gap + Math.min(prevLayout.width, prevLayout.width * 0.5 + gap)
          : 0
        scrollViewRef.current.scrollTo({
          x: Math.max(0, tagLeft - peekBefore),
          animated: true,
        })
      }
    },
    [gap]
  )

  const handlePress = useCallback(
    (index: number) => {
      const item = items[index]
      if (!item) return
      const next = new Set(selectedValues)
      if (next.has(item.value)) {
        next.delete(item.value)
      } else {
        next.add(item.value)
      }
      onSelectedValuesChange(next)
      scrollToReveal(index)
    },
    [items, selectedValues, onSelectedValuesChange, scrollToReveal]
  )

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={handleScroll}
      onLayout={(event: LayoutChangeEvent) => {
        scrollViewWidth.current = event.nativeEvent.layout.width
      }}
    >
      <XStack gap={gap} alignItems="center">
        {items.map((item, index) => {
          const selected = selectedValues.has(item.value)
          return (
            <FilterTag
              key={item.label}
              label={item.label}
              selected={selected}
              onPress={() => {
                handlePress(index)
              }}
              onLayout={(event: LayoutChangeEvent) => {
                handleTagLayout(index, event)
              }}
            />
          )
        })}
      </XStack>
    </ScrollView>
  )
}

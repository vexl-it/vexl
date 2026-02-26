import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React, {useCallback, useMemo, useRef} from 'react'
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

export interface FilterBarProps {
  readonly items: readonly string[]
  readonly selectedIndicesAtom: WritableAtom<
    ReadonlySet<number>,
    [SetStateAction<ReadonlySet<number>>],
    void
  >
}

interface TagLayout {
  readonly x: number
  readonly width: number
}

export function FilterBar({
  items,
  selectedIndicesAtom,
}: FilterBarProps): React.JSX.Element {
  const [selectedIndices, setSelectedIndices] = useAtom(selectedIndicesAtom)
  const spaceTokens = getTokens().space

  const gap = useMemo(() => Number(spaceTokens.$3.val), [spaceTokens])

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

      if (tagRight > offset + viewWidth) {
        scrollViewRef.current.scrollTo({
          x: tagRight - viewWidth + gap,
          animated: true,
        })
      } else if (tagLeft < offset) {
        scrollViewRef.current.scrollTo({
          x: Math.max(0, tagLeft - gap),
          animated: true,
        })
      }
    },
    [gap]
  )

  const handlePress = useCallback(
    (index: number) => {
      setSelectedIndices((prev) => {
        const next = new Set(prev)
        if (next.has(index)) {
          next.delete(index)
        } else {
          next.add(index)
        }
        return next
      })
      scrollToReveal(index)
    },
    [setSelectedIndices, scrollToReveal]
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
          const selected = selectedIndices.has(index)
          return (
            <FilterTag
              key={`${item}-${String(index)}`}
              label={item}
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

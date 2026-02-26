import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React, {useCallback, useMemo, useRef} from 'react'
import type {LayoutChangeEvent, ScrollView as RNScrollView} from 'react-native'
import {ScrollView} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {getTokens, useTheme} from 'tamagui'

import {SizableText, Stack, XStack} from '../primitives'

const UNDERLINE_HEIGHT = 3
const ANIMATION_DURATION = 300

interface TabLayout {
  readonly x: number
  readonly width: number
}

export interface TabsProps {
  readonly items: readonly string[]
  readonly activeIndexAtom: WritableAtom<number, [SetStateAction<number>], void>
  readonly size?: 'small' | 'large'
}

export function Tabs({
  items,
  activeIndexAtom,
  size = 'large',
}: TabsProps): React.JSX.Element {
  const [activeIndex, setActiveIndex] = useAtom(activeIndexAtom)
  const theme = useTheme()
  const spaceTokens = getTokens().space

  const scrollViewRef = useRef<RNScrollView>(null)
  const scrollViewWidth = useRef(0)
  const tabLayouts = useRef<TabLayout[]>([])
  const hasInitialized = useRef(false)

  const underlineLeft = useSharedValue(0)
  const underlineWidth = useSharedValue(0)
  const underlineOpacity = useSharedValue(0)

  const gap = useMemo(
    () =>
      size === 'large'
        ? Number(spaceTokens.$7.val)
        : Number(spaceTokens.$5.val),
    [size, spaceTokens]
  )

  const animatedUnderlineStyle = useAnimatedStyle(() => ({
    left: underlineLeft.value,
    width: underlineWidth.value,
    opacity: underlineOpacity.value,
  }))

  const handleTabLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const {x, width} = event.nativeEvent.layout
      tabLayouts.current[index] = {x, width}

      if (index === activeIndex) {
        if (!hasInitialized.current) {
          underlineLeft.value = x
          underlineWidth.value = width
          underlineOpacity.value = withTiming(1, {duration: 150})
          hasInitialized.current = true
        } else {
          underlineLeft.value = withTiming(x, {duration: ANIMATION_DURATION})
          underlineWidth.value = withTiming(width, {
            duration: ANIMATION_DURATION,
          })
        }
      }
    },
    [activeIndex, underlineLeft, underlineOpacity, underlineWidth]
  )

  const handleTabPress = useCallback(
    (index: number) => {
      if (index === activeIndex) return
      setActiveIndex(index)

      const layout = tabLayouts.current[index]
      if (layout && scrollViewRef.current) {
        const tabEnd = layout.x + layout.width + gap
        const viewWidth = scrollViewWidth.current
        const scrollX =
          viewWidth > 0
            ? Math.max(0, tabEnd - viewWidth)
            : Math.max(0, layout.x - gap)
        scrollViewRef.current.scrollTo({x: scrollX, animated: true})
      }
    },
    [activeIndex, gap, setActiveIndex]
  )

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={(event: LayoutChangeEvent) => {
        scrollViewWidth.current = event.nativeEvent.layout.width
      }}
    >
      <XStack
        gap={gap}
        alignItems="flex-start"
        paddingRight={gap}
        paddingBottom={Number(spaceTokens.$2.val) + UNDERLINE_HEIGHT}
      >
        {items.map((label, index) => {
          const isSelected = index === activeIndex
          return (
            <Stack
              key={`${label}-${String(index)}`}
              onPress={() => {
                handleTabPress(index)
              }}
              onLayout={(event: LayoutChangeEvent) => {
                handleTabLayout(index, event)
              }}
            >
              <SizableText
                fontFamily="$heading"
                fontSize={size === 'large' ? '$2' : '$1'}
                fontWeight={isSelected ? '700' : '400'}
                color={
                  isSelected
                    ? '$accentHighlightPrimary'
                    : '$foregroundSecondary'
                }
              >
                {label}
              </SizableText>
            </Stack>
          )
        })}
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 0,
              height: UNDERLINE_HEIGHT,
              backgroundColor: theme.accentHighlightPrimary.val,
            },
            animatedUnderlineStyle,
          ]}
        />
      </XStack>
    </ScrollView>
  )
}

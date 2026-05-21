import React, {useCallback, useEffect, useMemo, useRef} from 'react'
import type {LayoutChangeEvent, ScrollView as RNScrollView} from 'react-native'
import {ScrollView} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {getTokens, styled} from 'tamagui'

import {SizableText, Stack, XStack} from '../primitives'

const UNDERLINE_HEIGHT = 3
const ANIMATION_DURATION = 300

const TabsUnderline = styled(Stack, {
  name: 'TabsUnderline',
  position: 'absolute',
  bottom: 0,
  height: UNDERLINE_HEIGHT,
  backgroundColor: '$accentHighlightPrimary',
})

const AnimatedTabsUnderline = Animated.createAnimatedComponent(TabsUnderline)

interface TabLayout {
  readonly x: number
  readonly width: number
}

export interface TabItem<T> {
  readonly label: string
  readonly value: T
}

export interface TabsProps<T> {
  readonly tabs: ReadonlyArray<TabItem<T>>
  readonly activeTab: T
  readonly onTabPress: (value: T) => void
  readonly size?: 'small' | 'large'
  readonly contentPaddingLeft?: number
}

export function Tabs<T>({
  tabs,
  activeTab,
  onTabPress,
  contentPaddingLeft = 0,
  size = 'large',
}: TabsProps<T>): React.JSX.Element {
  const spaceTokens = getTokens().space

  const scrollViewRef = useRef<RNScrollView>(null)
  const scrollViewWidth = useRef(0)
  const tabLayouts = useRef<TabLayout[]>([])
  const hasInitialized = useRef(false)

  const underlineLeft = useSharedValue(0)
  const underlineWidth = useSharedValue(0)
  const underlineOpacity = useSharedValue(0)

  const gap = size === 'large' ? spaceTokens.$7.val : spaceTokens.$5.val

  const animatedUnderlineStyle = useAnimatedStyle(() => ({
    left: underlineLeft.value,
    width: underlineWidth.value,
    opacity: underlineOpacity.value,
  }))

  const activeIndex = useMemo(
    () => tabs.findIndex((tab) => tab.value === activeTab),
    [tabs, activeTab]
  )

  const scrollToTab = useCallback((index: number) => {
    const layout = tabLayouts.current[index]
    const viewWidth = scrollViewWidth.current
    if (!layout || !scrollViewRef.current || viewWidth <= 0) return

    const scrollX = Math.max(0, layout.x - (viewWidth - layout.width) / 2)
    scrollViewRef.current.scrollTo({x: scrollX, animated: true})
  }, [])

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
          scrollToTab(index)
          return
        }

        underlineLeft.value = withTiming(x, {duration: ANIMATION_DURATION})
        underlineWidth.value = withTiming(width, {
          duration: ANIMATION_DURATION,
        })
        scrollToTab(index)
      }
    },
    [activeIndex, scrollToTab, underlineLeft, underlineOpacity, underlineWidth]
  )

  useEffect(() => {
    if (!hasInitialized.current) return
    const layout = tabLayouts.current[activeIndex]
    if (!layout) return
    underlineLeft.value = withTiming(layout.x, {duration: ANIMATION_DURATION})
    underlineWidth.value = withTiming(layout.width, {
      duration: ANIMATION_DURATION,
    })
    scrollToTab(activeIndex)
  }, [activeIndex, scrollToTab, underlineLeft, underlineWidth])

  const handleTabPress = useCallback(
    (index: number) => {
      if (index === activeIndex) return
      const tab = tabs[index]
      if (!tab) return
      onTabPress(tab.value)
    },
    [activeIndex, onTabPress, tabs]
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
        paddingLeft={contentPaddingLeft}
        paddingRight={gap}
        paddingBottom={spaceTokens.$2.val + UNDERLINE_HEIGHT}
      >
        {tabs.map((tab, index) => {
          const isSelected = index === activeIndex
          return (
            <Stack
              key={tab.label}
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
                {tab.label}
              </SizableText>
            </Stack>
          )
        })}
        <AnimatedTabsUnderline style={animatedUnderlineStyle} />
      </XStack>
    </ScrollView>
  )
}

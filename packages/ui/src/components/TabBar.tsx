import React, {useCallback, useEffect, useMemo, useRef} from 'react'
import type {LayoutChangeEvent} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import {getTokens, styled, useTheme} from 'tamagui'

import type {IconProps} from '../icons/types'
import {Circle, SizableText, Stack, XStack, YStack} from '../primitives'

const ANIMATION_DURATION = 250

interface TabLayout {
  readonly x: number
  readonly width: number
}

export interface TabBarItem<T> {
  readonly label: string
  readonly value: T
  readonly icon: React.ComponentType<IconProps>
  readonly badge?: boolean
}

export interface TabBarProps<T> {
  readonly tabs: ReadonlyArray<TabBarItem<T>>
  readonly activeTab: T
  readonly onTabPress: (value: T) => void
  readonly bottomInset?: number
}

const TabBarFrame = styled(XStack, {
  name: 'TabBar',
  backgroundColor: '$navigationBackground',
  gap: '$4',
  paddingHorizontal: '$4',
  paddingBottom: '$5',
  alignSelf: 'stretch',
})

const TabFrame = styled(YStack, {
  name: 'TabBarTab',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$2',
  overflow: 'hidden',
  borderRadius: '$5',
  paddingVertical: '$3',
})

const IconPillFrame = styled(Stack, {
  name: 'TabBarIconPill',
  alignItems: 'center',
  paddingHorizontal: '$6',
  paddingVertical: '$2',
  borderRadius: '$11',
})

const ActivePillFrame = styled(Stack, {
  name: 'TabBarActivePill',
  position: 'absolute',
  backgroundColor: '$navigationBackgroundHighlight',
  borderRadius: '$11',
})

const AnimatedActivePill = Animated.createAnimatedComponent(ActivePillFrame)

const ICON_POP_DURATION = 150
const ICON_SETTLE_DURATION = 200
const ICON_SCALE_PEAK = 1.2
const ICON_ROTATE_PEAK = 10

function AnimatedTabIcon({
  icon: Icon,
  active,
  direction,
}: {
  readonly icon: React.ComponentType<IconProps>
  readonly active: boolean
  readonly direction: 'left' | 'right' | 'none'
}): React.JSX.Element {
  const theme = useTheme()

  const iconScale = useSharedValue(1)
  const iconRotate = useSharedValue(0)
  const prevActive = useRef(false)

  useEffect(() => {
    if (active && !prevActive.current) {
      const rotatePeak =
        direction === 'none'
          ? 0
          : direction === 'right'
            ? ICON_ROTATE_PEAK
            : -ICON_ROTATE_PEAK
      iconScale.value = withSequence(
        withTiming(ICON_SCALE_PEAK, {duration: ICON_POP_DURATION}),
        withTiming(1, {duration: ICON_SETTLE_DURATION})
      )
      iconRotate.value = withSequence(
        withTiming(rotatePeak, {duration: ICON_POP_DURATION}),
        withTiming(0, {duration: ICON_SETTLE_DURATION})
      )
    }
    prevActive.current = active
  }, [active, direction, iconRotate, iconScale])

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{scale: iconScale.value}, {rotate: `${iconRotate.value}deg`}],
  }))

  return (
    <Animated.View style={animatedIconStyle}>
      <Icon
        color={
          active
            ? theme.accentHighlightPrimary.val
            : theme.foregroundSecondary.val
        }
        size={getTokens().size.$7.val}
      />
    </Animated.View>
  )
}

export function TabBar<T>({
  tabs,
  activeTab,
  onTabPress,
  bottomInset,
}: TabBarProps<T>): React.JSX.Element {
  const pillLeft = useSharedValue(0)
  const pillWidth = useSharedValue(0)
  const pillHeight = useSharedValue(0)
  const pillTop = useSharedValue(0)
  const pillOpacity = useSharedValue(0)

  const tabLayouts = useRef<TabLayout[]>([])
  const pillOffset = useRef<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const hasInitialized = useRef(false)

  const activeIndex = useMemo(
    () => tabs.findIndex((tab) => tab.value === activeTab),
    [tabs, activeTab]
  )

  const positionPill = useCallback(
    (index: number, animate: boolean) => {
      const tab = tabLayouts.current[index]
      const pill = pillOffset.current
      if (!tab || !pill) return

      const targetLeft = tab.x + pill.x

      if (animate) {
        pillLeft.value = withTiming(targetLeft, {
          duration: ANIMATION_DURATION,
        })
        pillTop.value = withTiming(pill.y, {
          duration: ANIMATION_DURATION,
        })
        pillWidth.value = withTiming(pill.width, {
          duration: ANIMATION_DURATION,
        })
        pillHeight.value = withTiming(pill.height, {
          duration: ANIMATION_DURATION,
        })
      } else {
        pillLeft.value = targetLeft
        pillTop.value = pill.y
        pillWidth.value = pill.width
        pillHeight.value = pill.height
        pillOpacity.value = withTiming(1, {duration: 150})
      }
      hasInitialized.current = true
    },
    [pillHeight, pillLeft, pillOpacity, pillTop, pillWidth]
  )

  const handleTabLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const {x, width} = event.nativeEvent.layout
      tabLayouts.current[index] = {x, width}

      if (index === activeIndex && pillOffset.current) {
        positionPill(activeIndex, hasInitialized.current)
      }
    },
    [activeIndex, positionPill]
  )

  const handlePillLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const {x, y, width, height} = event.nativeEvent.layout
      pillOffset.current = {x, y, width, height}

      if (tabLayouts.current[activeIndex]) {
        positionPill(activeIndex, hasInitialized.current)
      }
    },
    [activeIndex, positionPill]
  )

  const prevActiveIndex = useRef(activeIndex)
  const directionRef = useRef<'left' | 'right' | 'none'>('none')

  useEffect(() => {
    if (prevActiveIndex.current !== activeIndex && hasInitialized.current) {
      directionRef.current =
        activeIndex > prevActiveIndex.current ? 'right' : 'left'
      positionPill(activeIndex, true)
    }
    prevActiveIndex.current = activeIndex
  }, [activeIndex, positionPill])

  const handleTabPress = useCallback(
    (index: number) => {
      const tab = tabs[index]
      if (!tab) return
      directionRef.current = index > activeIndex ? 'right' : 'left'
      onTabPress(tab.value)
      positionPill(index, true)
    },
    [activeIndex, onTabPress, tabs, positionPill]
  )

  const animatedPillStyle = useAnimatedStyle(() => ({
    left: pillLeft.value,
    top: pillTop.value,
    width: pillWidth.value,
    height: pillHeight.value,
    opacity: pillOpacity.value,
  }))

  return (
    <TabBarFrame paddingBottom={bottomInset ? bottomInset + 16 : '$5'}>
      <AnimatedActivePill style={animatedPillStyle} />
      {tabs.map((tab, index) => {
        const isActive = tab.value === activeTab
        return (
          <TabFrame
            key={tab.label}
            onPress={() => {
              handleTabPress(index)
            }}
            onLayout={(event: LayoutChangeEvent) => {
              handleTabLayout(index, event)
            }}
          >
            <IconPillFrame
              onLayout={index === 0 ? handlePillLayout : undefined}
            >
              <AnimatedTabIcon
                icon={tab.icon}
                active={isActive}
                direction={isActive ? directionRef.current : 'none'}
              />
              {tab.badge ? (
                <Circle
                  position="absolute"
                  top="$2"
                  right="$5"
                  size="$3"
                  backgroundColor="$accentYellowPrimary"
                />
              ) : null}
            </IconPillFrame>
            <SizableText
              fontFamily="$body"
              fontWeight="500"
              fontSize="$2"
              letterSpacing="$2"
              color={
                isActive ? '$accentHighlightPrimary' : '$foregroundSecondary'
              }
            >
              {tab.label}
            </SizableText>
          </TabFrame>
        )
      })}
    </TabBarFrame>
  )
}

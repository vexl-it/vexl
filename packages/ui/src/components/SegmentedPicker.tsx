import {Array, Option, pipe} from 'effect'
import React, {useCallback, useState} from 'react'
import {type LayoutChangeEvent} from 'react-native'
import Animated, {useAnimatedStyle, withTiming} from 'react-native-reanimated'
import {getTokens, styled, useTheme} from 'tamagui'

import {Stack, XStack} from '../primitives'
import {type TabItem} from './Tabs'
import {Typography} from './Typography'

const SegmentedPickerFrame = styled(XStack, {
  name: 'SegmentedPickerFrame',
  height: '$11',
  borderRadius: '$5',
  overflow: 'hidden',
  alignSelf: 'stretch',
  backgroundColor: '$backgroundSecondary',
})

const SegmentFrame = styled(Stack, {
  name: 'SegmentFrame',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: '$5',
})

export interface SegmentedPickerProps<T> {
  readonly tabs: ReadonlyArray<Omit<TabItem<T>, 'badge'>>
  readonly activeTab: T
  readonly onTabPress: (value: T) => void
}

const ANIMATION_CONFIG = {duration: 250}

export function SegmentedPicker<T>({
  tabs,
  activeTab,
  onTabPress,
}: SegmentedPickerProps<T>): React.JSX.Element {
  const theme = useTheme()
  const [containerWidth, setContainerWidth] = useState(0)
  const activeIndex = pipe(
    tabs,
    Array.findFirstIndex((tab) => tab.value === activeTab),
    Option.getOrElse(() => -1)
  )
  const tabCount = tabs.length
  const tabWidth = tabCount > 0 ? containerWidth / tabCount : 0

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width)
  }, [])

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(activeIndex * tabWidth, ANIMATION_CONFIG),
      },
    ],
    width: tabWidth,
  }))

  return (
    <SegmentedPickerFrame onLayout={handleLayout}>
      {containerWidth > 0 ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              borderRadius: getTokens().radius.$5.val,
              backgroundColor: theme.accentYellowSecondary.get(),
            },
            indicatorStyle,
          ]}
        />
      ) : null}
      {Array.map(tabs, (tab) => {
        const isSelected = tab.value === activeTab
        return (
          <SegmentFrame
            key={tab.label}
            onPress={() => {
              onTabPress(tab.value)
            }}
          >
            <Typography
              variant={isSelected ? 'paragraphDemibold' : 'paragraph'}
              color={
                isSelected ? '$accentHighlightPrimary' : '$foregroundPrimary'
              }
              textAlign="center"
              numberOfLines={1}
            >
              {tab.label}
            </Typography>
          </SegmentFrame>
        )
      })}
    </SegmentedPickerFrame>
  )
}

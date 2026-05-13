import React, {useCallback, useState} from 'react'
import {type LayoutChangeEvent} from 'react-native'
import Animated, {useAnimatedStyle, withTiming} from 'react-native-reanimated'
import {styled, useTheme} from 'tamagui'

import {SizableText, Stack, XStack} from '../primitives'

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

const SegmentLabel = styled(SizableText, {
  name: 'SegmentLabel',
  fontFamily: '$body',
  fontSize: '$4',
  fontWeight: '500',
  color: '$foregroundPrimary',
  textAlign: 'center',
  numberOfLines: 1,

  variants: {
    selected: {
      true: {
        fontWeight: '600',
        color: '$accentHighlightPrimary',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
})

export interface SegmentedPickerTab<T> {
  readonly label: string
  readonly value: T
}

export interface SegmentedPickerProps<T> {
  readonly tabs: ReadonlyArray<SegmentedPickerTab<T>>
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
  const activeIndex = tabs.findIndex((tab) => tab.value === activeTab)
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
              borderRadius: 16,
              backgroundColor: theme.accentYellowSecondary.get(),
            },
            indicatorStyle,
          ]}
        />
      ) : null}
      {tabs.map((tab) => {
        const isSelected = tab.value === activeTab
        return (
          <SegmentFrame
            key={tab.label}
            onPress={() => {
              onTabPress(tab.value)
            }}
          >
            <SegmentLabel selected={isSelected}>{tab.label}</SegmentLabel>
          </SegmentFrame>
        )
      })}
    </SegmentedPickerFrame>
  )
}

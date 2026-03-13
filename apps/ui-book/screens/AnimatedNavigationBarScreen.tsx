import {
  AnimatedNavigationBar,
  BellNotification,
  SizableText,
  Stack,
  TuneSettings,
  UserProfile,
  YStack,
} from '@vexl-next/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
} from 'react-native'
import {useSharedValue} from 'react-native-reanimated'

export function AnimatedNavigationBarScreen(): React.JSX.Element {
  const scrollY = useSharedValue(0)
  const [navBarHeight, setNavBarHeight] = useState(0)

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.value = event.nativeEvent.contentOffset.y
    },
    [scrollY]
  )

  const handleNavBarLayout = useCallback((event: LayoutChangeEvent) => {
    setNavBarHeight(event.nativeEvent.layout.height)
  }, [])

  const contentContainerStyle = useMemo(
    () => ({paddingTop: navBarHeight}),
    [navBarHeight]
  )

  return (
    <Stack flex={1} backgroundColor="$backgroundPrimary">
      <Stack
        position="absolute"
        top={0}
        left={0}
        right={0}
        zIndex={1}
        onLayout={handleNavBarLayout}
      >
        <AnimatedNavigationBar
          title="Marketplace"
          scrollY={scrollY}
          rightActions={[
            {icon: BellNotification, onPress: () => {}},
            {icon: TuneSettings, onPress: () => {}},
            {icon: UserProfile, onPress: () => {}},
          ]}
        />
      </Stack>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={contentContainerStyle}
      >
        <YStack gap="$4" paddingHorizontal="$5">
          {Array.from({length: 30}, (_, i) => (
            <YStack
              key={i}
              backgroundColor="$backgroundSecondary"
              borderRadius="$5"
              padding="$5"
              gap="$2"
            >
              <SizableText
                fontFamily="$body"
                fontWeight="600"
                fontSize="$2"
                color="$foregroundPrimary"
              >
                {`Card item ${i + 1}`}
              </SizableText>
              <SizableText
                fontFamily="$body"
                fontWeight="500"
                fontSize="$2"
                color="$foregroundSecondary"
              >
                Scroll to see the navigation bar animate
              </SizableText>
            </YStack>
          ))}
        </YStack>
      </ScrollView>
    </Stack>
  )
}

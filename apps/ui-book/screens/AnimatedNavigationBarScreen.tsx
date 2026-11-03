import {
  AnimatedNavigationBar,
  BellNotification,
  Stack,
  TuneSettings,
  Typography,
  UserProfile,
  YStack,
} from '@vexl-next/ui'
import React, {useState} from 'react'
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
} from 'react-native'
import {useSharedValue} from 'react-native-reanimated'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const PREVIEW_HEIGHT = 480

function Demos(): React.JSX.Element {
  const scrollY = useSharedValue(0)
  const [navBarHeight, setNavBarHeight] = useState(0)

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ): void => {
    scrollY.value = event.nativeEvent.contentOffset.y
  }

  const handleNavBarLayout = (event: LayoutChangeEvent): void => {
    setNavBarHeight(event.nativeEvent.layout.height)
  }

  return (
    <YStack
      height={PREVIEW_HEIGHT}
      borderRadius="$5"
      overflow="hidden"
      borderWidth={1}
      borderColor="$backgroundTertiary"
      backgroundColor="$backgroundPrimary"
    >
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
        contentContainerStyle={{paddingTop: navBarHeight}}
      >
        <YStack gap="$4" paddingHorizontal="$5" paddingBottom="$5">
          {Array.from({length: 30}, (_, i) => (
            <YStack
              key={i}
              backgroundColor="$backgroundSecondary"
              borderRadius="$5"
              padding="$5"
              gap="$2"
            >
              <Typography variant="descriptionBold" color="$foregroundPrimary">
                {`Card item ${i + 1}`}
              </Typography>
              <Typography variant="description" color="$foregroundSecondary">
                Scroll to see the navigation bar animate
              </Typography>
            </YStack>
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  )
}

export function AnimatedNavigationBarScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Animated Navigation Bar" demos={Demos} />
}

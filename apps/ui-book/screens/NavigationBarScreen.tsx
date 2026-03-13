import {
  AnimatedNavigationBar,
  Avatar,
  avatarsSvg,
  BellNotification,
  ChevronLeft,
  NavigationBar,
  SizableText,
  Theme,
  TuneSettings,
  UserProfile,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'
import {useSharedValue} from 'react-native-reanimated'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const AnonymousAvatar = avatarsSvg[0]!

function SectionLabel({
  children,
}: {
  readonly children: string
}): React.JSX.Element {
  return (
    <SizableText
      fontFamily="$body"
      fontWeight="600"
      fontSize="$2"
      color="$foregroundSecondary"
      paddingTop="$3"
    >
      {children}
    </SizableText>
  )
}

function AnimatedNavBarExample({
  scrollValue,
}: {
  readonly scrollValue: number
}): React.JSX.Element {
  const scrollY = useSharedValue(scrollValue)

  return (
    <AnimatedNavigationBar
      title="Marketplace"
      scrollY={scrollY}
      rightActions={[
        {icon: BellNotification, onPress: () => {}},
        {icon: TuneSettings, onPress: () => {}},
        {icon: UserProfile, onPress: () => {}},
      ]}
    />
  )
}

function ThemedColumn({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  return (
    <Theme name={theme}>
      <YStack
        gap="$4"
        backgroundColor="$backgroundPrimary"
        borderRadius="$4"
        overflow="hidden"
      >
        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$3"
          color="$foregroundPrimary"
          paddingHorizontal="$5"
          paddingTop="$5"
        >
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </SizableText>

        <SectionLabel>{'  Animated (scroll = 0)'}</SectionLabel>
        <AnimatedNavBarExample scrollValue={0} />

        <SectionLabel>{'  Animated (scroll = 25)'}</SectionLabel>
        <AnimatedNavBarExample scrollValue={25} />

        <SectionLabel>{'  Animated (scroll = 50)'}</SectionLabel>
        <AnimatedNavBarExample scrollValue={50} />

        <SectionLabel>{'  Back'}</SectionLabel>
        <NavigationBar
          style="back"
          title="Settings"
          leftAction={{icon: ChevronLeft, onPress: () => {}}}
          rightActions={[{icon: TuneSettings, onPress: () => {}}]}
        />

        <SectionLabel>{'  Chat'}</SectionLabel>
        <NavigationBar
          style="chat"
          name="Friend of friend"
          subtitle="136 in common"
          onPress={() => {}}
          leftAction={{icon: ChevronLeft, onPress: () => {}}}
          avatar={
            <Avatar size="medium">
              <AnonymousAvatar size={40} />
            </Avatar>
          }
          rightActions={[{icon: UserProfile, onPress: () => {}}]}
        />

        <YStack height="$5" />
      </YStack>
    </Theme>
  )
}

export function NavigationBarScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Navigation Bar
        </SizableText>

        <ThemedColumn theme="light" />
        <ThemedColumn theme="dark" />
      </YStack>
    </ScrollView>
  )
}

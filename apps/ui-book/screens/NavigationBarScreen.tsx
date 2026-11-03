import {
  AnimatedNavigationBar,
  Avatar,
  avatarsSvg,
  BellNotification,
  ChevronLeft,
  NavigationBar,
  TuneSettings,
  UserProfile,
} from '@vexl-next/ui'
import React from 'react'
import {useSharedValue} from 'react-native-reanimated'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const AnonymousAvatar = avatarsSvg[0]!

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

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="Animated (scroll = 0)">
        <AnimatedNavBarExample scrollValue={0} />
      </DemoSection>

      <DemoSection title="Animated (scroll = 25)">
        <AnimatedNavBarExample scrollValue={25} />
      </DemoSection>

      <DemoSection title="Animated (scroll = 50)">
        <AnimatedNavBarExample scrollValue={50} />
      </DemoSection>

      <DemoSection title="Back">
        <NavigationBar
          style="back"
          title="Settings"
          leftAction={{icon: ChevronLeft, onPress: () => {}}}
          rightActions={[{icon: TuneSettings, onPress: () => {}}]}
        />
      </DemoSection>

      <DemoSection title="Back with text action">
        <NavigationBar
          style="back"
          title="Filters"
          leftAction={{icon: ChevronLeft, onPress: () => {}}}
          rightActions={[{label: 'Clear all', onPress: () => {}}]}
        />
      </DemoSection>

      <DemoSection title="Back, long title with text action">
        <NavigationBar
          style="back"
          title="Kontaktní preference a nastavení soukromí"
          leftAction={{icon: ChevronLeft, onPress: () => {}}}
          rightActions={[{label: 'Vymazat vše', onPress: () => {}}]}
        />
      </DemoSection>

      <DemoSection title="Back, two right actions">
        <NavigationBar
          style="back"
          title="Offer"
          leftAction={{icon: ChevronLeft, onPress: () => {}}}
          rightActions={[
            {icon: BellNotification, onPress: () => {}},
            {icon: TuneSettings, onPress: () => {}},
          ]}
        />
      </DemoSection>

      <DemoSection title="Chat">
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
      </DemoSection>

      <DemoSection title="Chat, trusted">
        <NavigationBar
          style="chat"
          name="Friend of friend"
          subtitle="5 common"
          trustedFriends="2 trusted"
          avatar={
            <Avatar customSize={40}>
              <AnonymousAvatar size={40} />
            </Avatar>
          }
          leftAction={{icon: ChevronLeft, onPress: () => {}}}
          rightActions={[{icon: UserProfile, onPress: () => {}}]}
        />
      </DemoSection>

      <DemoSection title="Chat, long text">
        <NavigationBar
          style="chat"
          name="Freund eines Freundes aus deinem Netzwerk"
          subtitle="1 234 gemeinsame Freunde"
          trustedFriends="56 vertraut"
          avatar={
            <Avatar customSize={40}>
              <AnonymousAvatar size={40} />
            </Avatar>
          }
          leftAction={{icon: ChevronLeft, onPress: () => {}}}
          rightActions={[
            {icon: UserProfile, onPress: () => {}},
            {icon: UserProfile, onPress: () => {}},
          ]}
        />
      </DemoSection>
    </>
  )
}

export function NavigationBarScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Navigation Bar" demos={Demos} />
}

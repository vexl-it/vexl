import type {ReachStatsStep} from '@vexl-next/ui'
import {
  PeopleUsers,
  ReachStats,
  SizableText,
  Theme,
  YStack,
} from '@vexl-next/ui'
import React, {useCallback} from 'react'
import {Alert, ScrollView} from 'react-native'

const STEPS: readonly ReachStatsStep[] = [
  {label: 'Small pool', range: '1 - 100', icon: PeopleUsers, active: true},
  {label: 'Lake', range: '100 - 500', icon: PeopleUsers, active: false},
  {label: 'Ocean', range: '500+', icon: PeopleUsers, active: false},
]

const STEPS_MID: readonly ReachStatsStep[] = [
  {label: 'Small pool', range: '1 - 100', icon: PeopleUsers, active: true},
  {label: 'Lake', range: '100 - 500', icon: PeopleUsers, active: true},
  {label: 'Ocean', range: '500+', icon: PeopleUsers, active: false},
]

const STEPS_ALL: readonly ReachStatsStep[] = [
  {label: 'Small pool', range: '1 - 100', icon: PeopleUsers, active: true},
  {label: 'Lake', range: '100 - 500', icon: PeopleUsers, active: true},
  {label: 'Ocean', range: '500+', icon: PeopleUsers, active: true},
]

const STEPS_NONE: readonly ReachStatsStep[] = [
  {label: 'Small pool', range: '1 - 100', icon: PeopleUsers, active: false},
  {label: 'Lake', range: '100 - 500', icon: PeopleUsers, active: false},
  {label: 'Ocean', range: '500+', icon: PeopleUsers, active: false},
]

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

function ThemeGroup({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  const handleButtonPress = useCallback(() => {
    Alert.alert('Pressed', 'Add contacts')
  }, [])

  return (
    <Theme name={theme}>
      <YStack
        gap="$4"
        padding="$5"
        backgroundColor="$backgroundPrimary"
        borderRadius="$4"
      >
        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </SizableText>

        <SectionLabel>First step active (reach)</SectionLabel>
        <ReachStats
          subtitle="Your reach"
          headline="80 vexlaks"
          steps={STEPS}
          buttonLabel="Add contacts"
          onButtonPress={handleButtonPress}
        />

        <SectionLabel>Two steps active</SectionLabel>
        <ReachStats
          subtitle="Your reach"
          headline="350 vexlaks"
          steps={STEPS_MID}
          buttonLabel="Add contacts"
          onButtonPress={handleButtonPress}
        />

        <SectionLabel>All steps active</SectionLabel>
        <ReachStats
          subtitle="Your reach"
          headline="1200 vexlaks"
          steps={STEPS_ALL}
          buttonLabel="Add contacts"
          onButtonPress={handleButtonPress}
        />

        <SectionLabel>No steps active (deals)</SectionLabel>
        <ReachStats
          subtitle="Closed"
          headline="0 deals"
          steps={STEPS_NONE}
          buttonLabel="View deals"
          onButtonPress={handleButtonPress}
        />

        <SectionLabel>No stepper</SectionLabel>
        <ReachStats
          subtitle="Closed"
          headline="5 deals"
          steps={[]}
          buttonLabel="View deals"
          onButtonPress={handleButtonPress}
        />
      </YStack>
    </Theme>
  )
}

export function ReachStatsScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Reach Stats
        </SizableText>

        <ThemeGroup theme="light" />
        <ThemeGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}

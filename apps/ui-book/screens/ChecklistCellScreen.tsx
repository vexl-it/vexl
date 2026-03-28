import {
  Calendar,
  ChecklistCell,
  Map,
  MathCalculate,
  PeopleUsers,
  PinGeolocation,
  SizableText,
  Theme,
  YStack,
} from '@vexl-next/ui'
import React, {useCallback} from 'react'
import {Alert, ScrollView} from 'react-native'

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
  const handlePress = useCallback((label: string) => {
    Alert.alert('Pressed', label)
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

        <SectionLabel>Completed</SectionLabel>
        <YStack gap="$3">
          <ChecklistCell
            state="completed"
            headline="Select date and time"
            subtitle="Selected 3 date options"
          />
          <ChecklistCell
            state="completed"
            headline="Set meeting location"
            subtitle="Set: Vinohradsky pivovar"
          />
        </YStack>

        <SectionLabel>Initial (with icon)</SectionLabel>
        <YStack gap="$3">
          <ChecklistCell
            state="initial"
            headline="Select date and time"
            subtitle="Overline"
            icon={Calendar}
            onPress={() => {
              handlePress('Select date and time')
            }}
          />
          <ChecklistCell
            state="initial"
            headline="Set meeting location"
            subtitle="Vinohrady, radius 0.3 km"
            icon={PinGeolocation}
            onPress={() => {
              handlePress('Set meeting location')
            }}
          />
          <ChecklistCell
            state="initial"
            headline="Set trade amount"
            subtitle="300 - 3,000 CZK"
            icon={MathCalculate}
            onPress={() => {
              handlePress('Set trade amount')
            }}
          />
          <ChecklistCell
            state="initial"
            headline="Reveal identity"
            icon={PeopleUsers}
            onPress={() => {
              handlePress('Reveal identity')
            }}
          />
        </YStack>

        <SectionLabel>Pending</SectionLabel>
        <YStack gap="$3">
          <ChecklistCell
            state="pending"
            headline="Set meeting location"
            subtitle="Waiting for response"
            onPress={() => {
              handlePress('Set meeting location pending')
            }}
          />
          <ChecklistCell
            state="pending"
            headline="Choose network"
            subtitle="Lightning"
            onPress={() => {
              handlePress('Choose network pending')
            }}
          />
        </YStack>

        <SectionLabel>Mixed (realistic checklist)</SectionLabel>
        <YStack gap="$3">
          <ChecklistCell
            state="completed"
            headline="Select date and time"
            subtitle="Selected 3 date options"
          />
          <ChecklistCell
            state="completed"
            headline="Set meeting location"
            subtitle="Set: Vinohradsky pivovar"
          />
          <ChecklistCell
            state="pending"
            headline="Set trade amount"
            subtitle="Waiting for response"
            onPress={() => {
              handlePress('Set trade amount')
            }}
          />
          <ChecklistCell
            state="initial"
            headline="Choose network"
            subtitle="Lightning"
            icon={Map}
            onPress={() => {
              handlePress('Choose network')
            }}
          />
        </YStack>
      </YStack>
    </Theme>
  )
}

export function ChecklistCellScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Checklist Cell
        </SizableText>

        <ThemeGroup theme="light" />
        <ThemeGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}

import {
  BellNotification,
  Lock,
  ScreenCaptureShot,
  Selector,
  SizableText,
  Theme,
  TuneSettings,
  UserProfile,
  YStack,
} from '@vexl-next/ui'
import {atom} from 'jotai'
import React, {useCallback, useMemo} from 'react'
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
  const screenCaptureAtom = useMemo(() => atom(false), [])
  const notificationsAtom = useMemo(() => atom(true), [])

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

        <SectionLabel>Action (with chevron)</SectionLabel>
        <YStack gap="$3">
          <Selector
            label="Profile"
            icon={UserProfile}
            onPress={() => {
              handlePress('Profile')
            }}
          />
          <Selector
            label="Settings"
            icon={TuneSettings}
            onPress={() => {
              handlePress('Settings')
            }}
          />
          <Selector
            label="Security"
            icon={Lock}
            onPress={() => {
              handlePress('Security')
            }}
          />
          <Selector
            label="No icon"
            onPress={() => {
              handlePress('No icon')
            }}
          />
        </YStack>

        <SectionLabel>Switch (with toggle)</SectionLabel>
        <YStack gap="$3">
          <Selector
            variant="switch"
            label="Allow screencapture"
            icon={ScreenCaptureShot}
            valueAtom={screenCaptureAtom}
          />
          <Selector
            variant="switch"
            label="Notifications"
            icon={BellNotification}
            valueAtom={notificationsAtom}
          />
        </YStack>
      </YStack>
    </Theme>
  )
}

export function SelectorScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Selector
        </SizableText>

        <ThemeGroup theme="light" />
        <ThemeGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}

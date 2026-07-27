import {Theme, Typography, YStack} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

interface ComponentScreenLayoutProps {
  readonly title: string
  readonly demos: React.ComponentType
}

function ThemeSection({
  label,
  themeName,
  demos,
}: {
  readonly label: string
  readonly themeName: 'light' | 'dark'
  readonly demos: React.ComponentType
}): React.JSX.Element {
  const Demos = demos

  return (
    <Theme name={themeName}>
      <YStack
        gap="$4"
        padding="$5"
        borderRadius="$5"
        backgroundColor="$backgroundPrimary"
      >
        <Typography variant="titlesSmall" color="$foregroundPrimary">
          {label}
        </Typography>
        <Demos />
      </YStack>
    </Theme>
  )
}

export function ComponentScreenLayout({
  title,
  demos,
}: ComponentScreenLayoutProps): React.JSX.Element {
  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <YStack padding="$5" gap="$5" backgroundColor="$backgroundPrimary">
        <Typography variant="tabLargeBold" color="$foregroundPrimary">
          {title}
        </Typography>
        <ThemeSection label="Light" themeName="light" demos={demos} />
        <ThemeSection label="Dark" themeName="dark" demos={demos} />
      </YStack>
    </ScrollView>
  )
}

import {Theme, Typography, YStack} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

const MAX_CONTENT_WIDTH = 1280

interface ComponentScreenLayoutProps {
  readonly title: string
  readonly demos: React.ComponentType
}

export function DemoSection({
  title,
  children,
}: {
  readonly title: string
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <YStack gap="$3">
      <Typography variant="descriptionBold" color="$foregroundSecondary">
        {title}
      </Typography>
      {children}
    </YStack>
  )
}

function ThemeColumn({
  themeName,
  demos: Demos,
}: {
  readonly themeName: 'light' | 'dark'
  readonly demos: React.ComponentType
}): React.JSX.Element {
  return (
    <Theme name={themeName}>
      <YStack
        gap="$5"
        padding="$5"
        borderRadius="$5"
        backgroundColor="$backgroundPrimary"
        borderWidth={1}
        borderColor="$backgroundTertiary"
        $lg={{flex: 1, flexBasis: 0, minWidth: 0}}
      >
        <Typography variant="titlesSmall" color="$foregroundPrimary">
          {themeName === 'light' ? 'Light' : 'Dark'}
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
      <YStack
        padding="$5"
        gap="$5"
        width="100%"
        maxWidth={MAX_CONTENT_WIDTH}
        alignSelf="center"
      >
        <Typography variant="tabLargeBold" color="$foregroundPrimary">
          {title}
        </Typography>
        <YStack
          gap="$5"
          $lg={{flexDirection: 'row', alignItems: 'flex-start'}}
        >
          <ThemeColumn themeName="light" demos={demos} />
          <ThemeColumn themeName="dark" demos={demos} />
        </YStack>
      </YStack>
    </ScrollView>
  )
}

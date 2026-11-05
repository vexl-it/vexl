import {Theme, Typography, YStack} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

const MAX_CONTENT_WIDTH = 1280

interface ComponentScreenLayoutProps {
  readonly title: string
  readonly demos: React.ComponentType
  // For demos that scroll themselves (e.g. FlatList based): the columns fill
  // the screen height instead of the page scrolling.
  readonly fill?: boolean
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
  fill,
}: {
  readonly themeName: 'light' | 'dark'
  readonly demos: React.ComponentType
  readonly fill: boolean
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
        flex={fill ? 1 : undefined}
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
  fill = false,
}: ComponentScreenLayoutProps): React.JSX.Element {
  const content = (
    <YStack
      padding="$5"
      gap="$5"
      width="100%"
      maxWidth={MAX_CONTENT_WIDTH}
      alignSelf="center"
      flex={fill ? 1 : undefined}
    >
      <Typography variant="tabLargeBold" color="$foregroundPrimary">
        {title}
      </Typography>
      <YStack
        gap="$5"
        flex={fill ? 1 : undefined}
        $lg={{
          flexDirection: 'row',
          alignItems: fill ? 'stretch' : 'flex-start',
        }}
      >
        <ThemeColumn themeName="light" demos={demos} fill={fill} />
        <ThemeColumn themeName="dark" demos={demos} fill={fill} />
      </YStack>
    </YStack>
  )

  if (fill) return content

  return <ScrollView keyboardShouldPersistTaps="handled">{content}</ScrollView>
}

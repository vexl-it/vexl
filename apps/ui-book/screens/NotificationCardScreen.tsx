import {
  Avatar,
  NotificationCard,
  SizableText,
  TextTag,
  Theme,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const vexlAvatarSource = require('../assets/vexlAvatar.png') as number

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

function VexlAvatar(): React.JSX.Element {
  return <Avatar source={vexlAvatarSource} size="small" customSize={36} />
}

function ThemeGroup({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
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

        <SectionLabel>Default</SectionLabel>
        <NotificationCard
          avatar={<VexlAvatar />}
          name="Vexl"
          time="13:02"
          category="System"
          message='From permissionless to permissioned. This week, we explore how quickly "your money" turns into theirs.'
        />

        <SectionLabel>With New tag</SectionLabel>
        <NotificationCard
          avatar={<VexlAvatar />}
          name="Vexl"
          time="13:02"
          category="System"
          message='From permissionless to permissioned. This week, we explore how quickly "your money" turns into theirs.'
          tag={<TextTag variant="new" label="New" />}
        />

        <SectionLabel>Pressable</SectionLabel>
        <NotificationCard
          avatar={<VexlAvatar />}
          name="Vexl"
          time="09:15"
          category="Blog"
          message="Why peer-to-peer trading matters more than ever in 2026."
          tag={<TextTag variant="new" label="New" />}
          onPress={() => {}}
        />
      </YStack>
    </Theme>
  )
}

export function NotificationCardScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Notification Card
        </SizableText>

        <ThemeGroup theme="light" />
        <ThemeGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}

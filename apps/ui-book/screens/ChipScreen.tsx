import {Avatar, Chip, SizableText, Theme, XStack, YStack} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const vexlAvatarSource = require('../assets/vexlAvatar.png') as number

function ChipAvatar(): React.JSX.Element {
  return <Avatar source={vexlAvatarSource} customSize={16} />
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

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
          paddingTop="$3"
        >
          Single chip
        </SizableText>
        <Chip name="Marcel Mrkev" avatar={<ChipAvatar />} />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
          paddingTop="$3"
        >
          Long name (truncated)
        </SizableText>
        <Chip
          name="Very Long Username That Should Truncate"
          avatar={<ChipAvatar />}
        />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
          paddingTop="$3"
        >
          Multiple chips in a row
        </SizableText>
        <XStack gap="$3" flexWrap="wrap">
          <Chip name="Marcel" avatar={<ChipAvatar />} />
          <Chip name="Stepan" avatar={<ChipAvatar />} />
          <Chip name="Grafon" avatar={<ChipAvatar />} />
          <Chip name="Alice" avatar={<ChipAvatar />} />
        </XStack>
      </YStack>
    </Theme>
  )
}

export function ChipScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Chip
        </SizableText>

        <ThemeGroup theme="light" />
        <ThemeGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}

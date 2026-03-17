import {Chip, SizableText, Theme, XStack, YStack} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

const vexlAvatarSource = require('../assets/vexlAvatar.png') as number

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
        <Chip name="Marcel Mrkev" avatarSource={vexlAvatarSource} />

        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
          paddingTop="$3"
        >
          No avatar
        </SizableText>
        <Chip name="Anonymous User" />

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
          avatarSource={vexlAvatarSource}
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
          <Chip name="Marcel" avatarSource={vexlAvatarSource} />
          <Chip name="Stepan" avatarSource={vexlAvatarSource} />
          <Chip name="Grafon" avatarSource={vexlAvatarSource} />
          <Chip name="Alice" avatarSource={vexlAvatarSource} />
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

import {
  SizableText,
  Theme,
  TrustedFriendsBox,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'
import {getTokens} from 'tamagui'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <TrustedFriendsBox
        heading="Trusted friends"
        friends={[{id: 'jana', name: 'Jana Nováková'}]}
        text="Jana Nováková has you and the seller in their contacts."
      />
      <TrustedFriendsBox
        heading="Trusted friends"
        friends={[
          {id: 'jana', name: 'Jana Nováková', trusted: false},
          {id: 'petr', name: 'Petr Svoboda'},
          {id: 'tereza', name: 'Tereza Malá'},
        ]}
        text="Jana Nováková, Petr Svoboda and Tereza Malá have you and the buyer in their contacts."
      />
    </YStack>
  )
}

function ThemeGroup({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  return (
    <Theme name={theme}>
      <YStack
        width={getTokens().size.$13.val * 5 + getTokens().size.$9.val}
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
        <Demos />
      </YStack>
    </Theme>
  )
}

export function TrustedFriendsBoxScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Trusted Friends Box
        </SizableText>
        <ScrollView horizontal>
          <XStack gap="$4" alignItems="flex-start">
            <ThemeGroup theme="light" />
            <ThemeGroup theme="dark" />
          </XStack>
        </ScrollView>
      </YStack>
    </ScrollView>
  )
}

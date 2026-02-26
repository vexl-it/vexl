import {Dot, SizableText, Theme, XStack, YStack} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

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

function ThemedColumn({
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
        flex={1}
      >
        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </SizableText>

        <SectionLabel>Small (default)</SectionLabel>
        <XStack gap="$4" alignItems="center">
          <Dot />
          <Dot backgroundColor="$accentYellowPrimary" />
          <Dot backgroundColor="$greenBackground" />
          <Dot backgroundColor="$redBackground" />
        </XStack>

        <SectionLabel>Number</SectionLabel>
        <XStack gap="$4" alignItems="center">
          <Dot count={1} />
          <Dot count={3} />
          <Dot count={9} />
        </XStack>

        <SectionLabel>Number — custom bg</SectionLabel>
        <XStack gap="$4" alignItems="center">
          <Dot count={2} backgroundColor="$accentYellowPrimary" />
          <Dot count={5} backgroundColor="$greenBackground" />
        </XStack>
      </YStack>
    </Theme>
  )
}

export function DotScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Dot
        </SizableText>

        <XStack gap="$3">
          <ThemedColumn theme="light" />
          <ThemedColumn theme="dark" />
        </XStack>
      </YStack>
    </ScrollView>
  )
}

import {Loader, SizableText, Theme, XStack, YStack} from '@vexl-next/ui'
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

        <SectionLabel>Small</SectionLabel>
        <XStack gap="$4" alignItems="center">
          <Loader size="small" />
        </XStack>

        <SectionLabel>Medium (default)</SectionLabel>
        <XStack gap="$4" alignItems="center">
          <Loader size="medium" />
        </XStack>

        <SectionLabel>Large</SectionLabel>
        <XStack gap="$4" alignItems="center">
          <Loader size="large" />
        </XStack>

        <SectionLabel>Custom color</SectionLabel>
        <XStack gap="$4" alignItems="center">
          <Loader size="medium" color="red" />
          <Loader size="medium" color="#00CC88" />
        </XStack>
      </YStack>
    </Theme>
  )
}

export function LoaderScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Loader
        </SizableText>

        <XStack gap="$3">
          <ThemedColumn theme="light" />
          <ThemedColumn theme="dark" />
        </XStack>
      </YStack>
    </ScrollView>
  )
}

import {
  IconButton,
  SizableText,
  Stack,
  Theme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

function PlaceholderIcon(): React.JSX.Element {
  return (
    <Stack
      width="$7"
      height="$7"
      borderWidth={2}
      borderColor="$foregroundPrimary"
      borderRadius="$1"
    />
  )
}

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

        <SectionLabel>Default</SectionLabel>
        <XStack gap="$3">
          <IconButton onPress={() => {}}>
            <PlaceholderIcon />
          </IconButton>
        </XStack>

        <SectionLabel>With badge</SectionLabel>
        <XStack gap="$3">
          <IconButton showBadge onPress={() => {}}>
            <PlaceholderIcon />
          </IconButton>
        </XStack>
      </YStack>
    </Theme>
  )
}

export function IconButtonScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Icon Button
        </SizableText>

        <XStack gap="$3">
          <ThemedColumn theme="light" />
          <ThemedColumn theme="dark" />
        </XStack>
      </YStack>
    </ScrollView>
  )
}

import {
  NavButton,
  SizableText,
  Square,
  Theme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

function IconPlaceholder({color}: {readonly color: string}): React.JSX.Element {
  return (
    <Square size="$7" borderRadius="$1" borderWidth={2} borderColor={color} />
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

        <SectionLabel>Icon type</SectionLabel>

        <XStack gap="$3">
          <NavButton variant="highlighted" onPress={() => {}}>
            <IconPlaceholder color="#BE8821" />
          </NavButton>

          <NavButton variant="destructive" onPress={() => {}}>
            <IconPlaceholder color="#FFFFFF" />
          </NavButton>

          <NavButton variant="normal" onPress={() => {}}>
            <IconPlaceholder color="#000000" />
          </NavButton>
        </XStack>

        <SectionLabel>Text type</SectionLabel>

        <XStack gap="$3" flexWrap="wrap">
          <NavButton variant="highlighted" type="text" onPress={() => {}}>
            Label
          </NavButton>

          <NavButton variant="destructive" type="text" onPress={() => {}}>
            Label
          </NavButton>

          <NavButton variant="normal" type="text" onPress={() => {}}>
            Label
          </NavButton>
        </XStack>
      </YStack>
    </Theme>
  )
}

export function NavButtonScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Nav Button
        </SizableText>

        <XStack gap="$3">
          <ThemedColumn theme="light" />
          <ThemedColumn theme="dark" />
        </XStack>
      </YStack>
    </ScrollView>
  )
}

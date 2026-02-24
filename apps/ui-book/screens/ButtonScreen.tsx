import {Button, SizableText, Theme, XStack, YStack} from '@vexl-next/ui'
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

function ButtonVariants({
  size,
}: {
  readonly size: 'large' | 'medium' | 'small'
}): React.JSX.Element {
  return (
    <YStack gap="$3" width="100%">
      <SectionLabel>
        {size.charAt(0).toUpperCase() + size.slice(1)}
      </SectionLabel>

      <Button variant="primary" size={size} onPress={() => {}}>
        Primary
      </Button>

      <Button variant="secondary" size={size} onPress={() => {}}>
        Secondary
      </Button>

      <Button variant="destructive" size={size} onPress={() => {}}>
        Destructive
      </Button>

      {size === 'small' ? (
        <Button variant="tertiary" size={size} onPress={() => {}}>
          Tertiary
        </Button>
      ) : null}

      <Button variant="disabled" size={size} onPress={() => {}}>
        Disabled
      </Button>
    </YStack>
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

        <ButtonVariants size="large" />
        <ButtonVariants size="medium" />
        <ButtonVariants size="small" />
      </YStack>
    </Theme>
  )
}

export function ButtonScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Buttons
        </SizableText>

        <XStack gap="$3">
          <ThemedColumn theme="light" />
          <ThemedColumn theme="dark" />
        </XStack>
      </YStack>
    </ScrollView>
  )
}

import {Disclosure, SizableText, Theme, XStack, YStack} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

const bodyText =
  'Your offer is shared only with people in your contact list and their contacts. Nobody else can see it, and we never see it either.'

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

        <YStack gap="$3">
          <Disclosure title="How sharing works">{bodyText}</Disclosure>
          <Disclosure title="How sharing works (default open)" defaultOpen>
            {bodyText}
          </Disclosure>
        </YStack>
      </YStack>
    </Theme>
  )
}

export function DisclosureScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Disclosure
        </SizableText>

        <XStack gap="$3">
          <ThemedColumn theme="light" />
          <ThemedColumn theme="dark" />
        </XStack>
      </YStack>
    </ScrollView>
  )
}

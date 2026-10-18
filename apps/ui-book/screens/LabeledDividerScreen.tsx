import {LabeledDivider, SizableText, Theme, YStack} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

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

        <LabeledDivider label="Restored messages above" />
      </YStack>
    </Theme>
  )
}

export function LabeledDividerScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Labeled Divider
        </SizableText>

        <YStack gap="$3">
          <ThemedColumn theme="light" />
          <ThemedColumn theme="dark" />
        </YStack>
      </YStack>
    </ScrollView>
  )
}

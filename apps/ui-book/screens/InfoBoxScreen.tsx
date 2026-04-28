import {InfoBox, SizableText, Theme, YStack} from '@vexl-next/ui'
import React from 'react'
import {ScrollView} from 'react-native'

const sampleText =
  "Waiting for the other party's response. You'll get a notification once they reply."

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
          <InfoBox>{sampleText}</InfoBox>
          <InfoBox variant="pink">{sampleText}</InfoBox>
          <InfoBox variant="tertiary">{sampleText}</InfoBox>
          <InfoBox variant="naked">{sampleText}</InfoBox>
        </YStack>
      </YStack>
    </Theme>
  )
}

export function InfoBoxScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Info Box
        </SizableText>

        <YStack gap="$3">
          <ThemedColumn theme="light" />
          <ThemedColumn theme="dark" />
        </YStack>
      </YStack>
    </ScrollView>
  )
}

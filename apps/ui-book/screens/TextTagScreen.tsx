import {SizableText, TextTag, Theme, XStack, YStack} from '@vexl-next/ui'
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

        <XStack flexWrap="wrap" gap="$3">
          <TextTag variant="offer" label="Offer" />
          <TextTag variant="request" label="Request" />
          <TextTag variant="approved" label="Approved" />
          <TextTag variant="waiting" label="Waiting" />
          <TextTag variant="new" label="New" />
          <TextTag variant="paused" label="Paused" />
          <TextTag variant="set" label="Set" />
          <TextTag variant="accepted" label="Accepted" />
          <TextTag
            variant="waitingForConfirmation"
            label="Waiting for confirmation"
          />
          <TextTag variant="outdated" label="Outdated" />
        </XStack>
      </YStack>
    </Theme>
  )
}

export function TextTagScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Text Tag
        </SizableText>

        <XStack gap="$3">
          <ThemedColumn theme="light" />
          <ThemedColumn theme="dark" />
        </XStack>
      </YStack>
    </ScrollView>
  )
}

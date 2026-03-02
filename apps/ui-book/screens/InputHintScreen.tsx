import {InputHint, SizableText, YStack} from '@vexl-next/ui'
import React from 'react'

export function InputHintScreen(): React.JSX.Element {
  return (
    <YStack flex={1} padding="$6" gap="$7" backgroundColor="$backgroundPrimary">
      <SizableText fontWeight="600" fontSize="$5">
        InputHint
      </SizableText>

      <YStack gap="$4">
        <SizableText
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
        >
          Default
        </SizableText>
        <InputHint>This is a default hint</InputHint>
      </YStack>

      <YStack gap="$4">
        <SizableText
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
        >
          Error
        </SizableText>
        <InputHint variant="error">Something went wrong</InputHint>
      </YStack>

      <YStack gap="$4">
        <SizableText
          fontWeight="600"
          fontSize="$2"
          color="$foregroundSecondary"
        >
          Without icon
        </SizableText>
        <InputHint showIcon={false}>Hint without icon</InputHint>
        <InputHint variant="error" showIcon={false}>
          Error without icon
        </InputHint>
      </YStack>
    </YStack>
  )
}

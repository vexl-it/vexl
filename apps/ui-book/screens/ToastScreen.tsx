import {Button, SizableText, Toast, YStack} from '@vexl-next/ui'
import {atom, useSetAtom} from 'jotai'
import React from 'react'

const toastMessageAtom = atom<string | null>(null)

function TriggerButton({
  label,
  message,
}: {
  readonly label: string
  readonly message: string
}): React.JSX.Element {
  const showToast = useSetAtom(toastMessageAtom)

  return (
    <Button
      variant="secondary"
      size="medium"
      onPress={() => {
        showToast(message)
      }}
    >
      {label}
    </Button>
  )
}

export function ToastScreen(): React.JSX.Element {
  return (
    <YStack flex={1}>
      <YStack flex={1} padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Toast
        </SizableText>

        <SizableText
          fontFamily="$body"
          fontWeight="500"
          fontSize="$2"
          color="$foregroundSecondary"
        >
          Tap any button to show a toast. It fades in, stays for 3 seconds,
          then fades out automatically.
        </SizableText>

        <TriggerButton
          label="Copy to Clipboard"
          message="Copied to clipboard"
        />
        <TriggerButton label="Share Link" message="Link shared successfully" />
        <TriggerButton label="Save Settings" message="Settings saved" />
      </YStack>

      <Toast messageAtom={toastMessageAtom} topOffset={8} />
    </YStack>
  )
}

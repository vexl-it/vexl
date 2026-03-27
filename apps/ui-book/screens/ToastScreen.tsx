import {Button, SizableText} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'

import React from 'react'
import {ScrollView} from 'react-native'
import {toastAtom} from '../state/toastAtom'

function TriggerButton({
  label,
  message,
}: {
  readonly label: string
  readonly message: string
}): React.JSX.Element {
  const showToast = useSetAtom(toastAtom)

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
    <ScrollView contentContainerStyle={{padding: 16, gap: 16}}>
      <SizableText
        fontFamily="$heading"
        fontWeight="700"
        fontSize="$3"
        color="$foregroundPrimary"
      >
        Toast (Global)
      </SizableText>

      <SizableText
        fontFamily="$body"
        fontWeight="500"
        fontSize="$2"
        color="$foregroundSecondary"
      >
        Tap any button to show a global toast at the top of the screen. It fades
        in, stays for 3 seconds, then fades out automatically.
      </SizableText>

      <TriggerButton label="Copy to Clipboard" message="Copied to clipboard" />
      <TriggerButton label="Share Link" message="Link shared successfully" />
      <TriggerButton label="Save Settings" message="Settings saved" />
    </ScrollView>
  )
}

import {Button, Typography} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React from 'react'

import {toastAtom} from '../state/toastAtom'
import {ComponentScreenLayout} from './ComponentScreenLayout'

const messages = [
  {label: 'Copy to Clipboard', message: 'Copied to clipboard'},
  {label: 'Share Link', message: 'Link shared successfully'},
  {label: 'Save Settings', message: 'Settings saved'},
]

function Demos(): React.JSX.Element {
  const showToast = useSetAtom(toastAtom)

  return (
    <>
      <Typography variant="description" color="$foregroundSecondary">
        Tap any button to show a global toast at the top of the screen. It fades
        in, stays for 3 seconds, then fades out automatically. The toast follows
        the app theme.
      </Typography>
      {messages.map(({label, message}) => (
        <Button
          key={label}
          variant="secondary"
          size="medium"
          onPress={() => {
            showToast(message)
          }}
        >
          {label}
        </Button>
      ))}
    </>
  )
}

export function ToastScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Toast" demos={Demos} />
}

import {
  KeyboardAvoidingView,
  TextField,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {atom} from 'jotai'
import React, {useMemo} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const valueAtom = useMemo(() => atom(''), [])

  return (
    <YStack
      height={320}
      overflow="hidden"
      borderRadius="$5"
      backgroundColor="$backgroundSecondary"
    >
      <KeyboardAvoidingView>
        <YStack flex={1} justifyContent="space-between" gap="$4" padding="$5">
          <Typography variant="description" color="$foregroundSecondary">
            Focus the field to see the default height behavior keep it above the
            keyboard.
          </Typography>
          <TextField
            valueAtom={valueAtom}
            placeholder="Field near the bottom"
            showClear
          />
        </YStack>
      </KeyboardAvoidingView>
    </YStack>
  )
}

export function KeyboardAvoidingViewScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Keyboard Avoiding View" demos={Demos} />
}

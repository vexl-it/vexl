import {
  DismissKeyboardOnPressOutside,
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
    <DismissKeyboardOnPressOutside>
      <YStack
        minHeight={240}
        gap="$4"
        padding="$5"
        borderRadius="$5"
        backgroundColor="$backgroundSecondary"
      >
        <Typography variant="description" color="$foregroundSecondary">
          Focus the field, then tap anywhere in this card to dismiss the
          keyboard.
        </Typography>
        <TextField
          valueAtom={valueAtom}
          placeholder="Open the keyboard"
          showClear
        />
        <YStack flex={1} justifyContent="flex-end">
          <Typography variant="micro" color="$foregroundTertiary">
            This entire surface is the press-outside target.
          </Typography>
        </YStack>
      </YStack>
    </DismissKeyboardOnPressOutside>
  )
}

export function DismissKeyboardOnPressOutsideScreen(): React.JSX.Element {
  return (
    <ComponentScreenLayout
      title="Dismiss Keyboard On Press Outside"
      demos={Demos}
    />
  )
}

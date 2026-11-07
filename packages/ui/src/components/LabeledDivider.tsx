import React from 'react'
import {styled} from 'tamagui'

import {Stack, XStack} from '../primitives'
import {Typography} from './Typography'

const DividerLine = styled(Stack, {
  name: 'LabeledDividerLine',
  flex: 1,
  height: '$0.5',
  backgroundColor: '$backgroundTertiary',
})

export interface LabeledDividerProps {
  readonly label: string
}

export function LabeledDivider({
  label,
}: LabeledDividerProps): React.JSX.Element {
  return (
    <XStack alignItems="center" gap="$3">
      <DividerLine />
      <Typography variant="micro" color="$foregroundTertiary">
        {label}
      </Typography>
      <DividerLine />
    </XStack>
  )
}

import React from 'react'

import {XStack} from '../primitives'
import {Typography} from './Typography'

export interface LengthCounterProps {
  readonly length: number
  readonly maxLength: number
}

export function LengthCounter({
  length,
  maxLength,
}: LengthCounterProps): React.JSX.Element {
  return (
    <XStack
      alignItems="center"
      justifyContent="flex-end"
      height="$7"
      paddingHorizontal="$3"
    >
      <Typography variant="micro" color="$greenForeground">
        {length}
      </Typography>
      <Typography variant="micro" color="$foregroundPrimary">
        {`/${maxLength}`}
      </Typography>
    </XStack>
  )
}

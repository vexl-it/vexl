import React from 'react'

import {XStack} from '../primitives'
import {Typography} from './Typography'

export interface CountBadgeProps {
  readonly count: number
}

export function CountBadge({count}: CountBadgeProps): React.JSX.Element {
  return (
    <XStack
      backgroundColor="$accentYellowSecondary"
      borderRadius="$8"
      minWidth="$6"
      paddingHorizontal="$1"
      paddingVertical="$1"
      alignItems="center"
      justifyContent="center"
    >
      <Typography
        variant="micro"
        color="$accentHighlightSecondary"
        textAlign="center"
      >
        {count}
      </Typography>
    </XStack>
  )
}

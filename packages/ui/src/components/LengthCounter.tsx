import React from 'react'
import {styled} from 'tamagui'

import {XStack} from '../primitives'
import {Typography} from './Typography'

const LengthCounterFrame = styled(XStack, {
  name: 'LengthCounter',
  alignItems: 'center',
  justifyContent: 'flex-end',
  height: '$7',
  paddingHorizontal: '$3',
})

export interface LengthCounterProps {
  readonly length: number
  readonly maxLength: number
}

export function LengthCounter({
  length,
  maxLength,
}: LengthCounterProps): React.JSX.Element {
  return (
    <LengthCounterFrame>
      <Typography variant="micro" color="$greenForeground">
        {length}
      </Typography>
      <Typography variant="micro" color="$foregroundPrimary">
        {`/${maxLength}`}
      </Typography>
    </LengthCounterFrame>
  )
}

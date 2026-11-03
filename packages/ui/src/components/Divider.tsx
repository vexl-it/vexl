import React from 'react'
import {styled} from 'tamagui'

import {Stack, XStack} from '../primitives'
import {Typography} from './Typography'

const DividerLine = styled(Stack, {
  name: 'Divider',
  height: '$0.5',
  alignSelf: 'stretch',
  backgroundColor: '$backgroundTertiary',
})

export interface DividerProps extends Omit<
  React.ComponentProps<typeof XStack>,
  'children'
> {
  readonly label?: string
}

export function Divider({label, ...rest}: DividerProps): React.JSX.Element {
  if (label === undefined) return <DividerLine {...rest} />

  return (
    <XStack alignItems="center" alignSelf="stretch" gap="$3" {...rest}>
      <DividerLine flex={1} alignSelf="auto" />
      <Typography variant="description" color="$foregroundSecondary">
        {label}
      </Typography>
      <DividerLine flex={1} alignSelf="auto" />
    </XStack>
  )
}

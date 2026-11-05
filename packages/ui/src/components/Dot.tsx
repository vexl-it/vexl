import React from 'react'
import {styled} from 'tamagui'

import {Circle} from '../primitives'
import {Typography} from './Typography'

const DotFrame = styled(Circle, {
  name: 'Dot',
  backgroundColor: '$pinkLight',
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    variant: {
      small: {
        size: '$3',
      },
      number: {
        size: '$6',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'small',
  },
})

type DotFrameProps = React.ComponentProps<typeof DotFrame>

interface DotProps extends Omit<DotFrameProps, 'variant' | 'children'> {
  readonly variant?: 'small' | 'number'
  readonly count?: number
}

export function Dot({count, variant, ...rest}: DotProps): React.JSX.Element {
  const resolvedVariant = count !== undefined ? 'number' : (variant ?? 'small')

  return (
    <DotFrame variant={resolvedVariant} {...rest}>
      {count !== undefined ? (
        <Typography variant="micro" color="$black100" textAlign="center">
          {count}
        </Typography>
      ) : null}
    </DotFrame>
  )
}

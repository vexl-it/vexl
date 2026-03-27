import React from 'react'
import {styled} from 'tamagui'

import {Circle, SizableText} from '../primitives'

const DotFrame = styled(Circle, {
  name: 'Dot',
  backgroundColor: '$pinkBright100',
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

const DotLabel = styled(SizableText, {
  name: 'DotLabel',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$1',
  letterSpacing: '$1',
  color: '$black100',
  textAlign: 'center',
})

export function Dot({count, variant, ...rest}: DotProps): React.JSX.Element {
  const resolvedVariant = count !== undefined ? 'number' : (variant ?? 'small')

  return (
    <DotFrame variant={resolvedVariant} {...rest}>
      {count !== undefined ? <DotLabel>{count}</DotLabel> : null}
    </DotFrame>
  )
}

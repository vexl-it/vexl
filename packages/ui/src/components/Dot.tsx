import React from 'react'
import type {TextStyle} from 'react-native'
import {Text} from 'react-native'
import {getTokens, styled} from 'tamagui'

import {bodyFont} from '../config/fonts'
import {Circle} from '../primitives'

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

export function Dot({count, variant, ...rest}: DotProps): React.JSX.Element {
  const resolvedVariant = count !== undefined ? 'number' : (variant ?? 'small')

  const labelStyle: TextStyle = {
    fontFamily: bodyFont.family,
    fontWeight: bodyFont.weight?.[5] as TextStyle['fontWeight'],
    fontSize: bodyFont.size[1],
    letterSpacing: bodyFont.letterSpacing[1],
    color: getTokens().color.black100.val,
    textAlign: 'center',
  }

  return (
    <DotFrame variant={resolvedVariant} {...rest}>
      {count !== undefined ? <Text style={labelStyle}>{count}</Text> : null}
    </DotFrame>
  )
}

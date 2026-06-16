import React from 'react'
import {styled} from 'tamagui'

import {Stack} from '../primitives'
import {Typography, type TypographyProps} from './Typography'

type CardButtonType = 'filled' | 'outlined' | 'text'

const CardButtonFrame = styled(Stack, {
  name: 'CardButton',
  role: 'button',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: '$4',
  paddingVertical: '$3',
  borderRadius: '$3',

  pressStyle: {
    opacity: 0.7,
  },

  variants: {
    variant: {
      filled: {
        backgroundColor: '$black100',
        borderWidth: 1,
        borderColor: 'transparent',
      },
      filledContrast: {
        backgroundColor: '$foregroundPrimary',
        borderWidth: 1,
        borderColor: 'transparent',
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$foregroundPrimary',
      },
      outlinedContrast: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$backgroundPrimary',
      },
      text: {
        backgroundColor: 'transparent',
      },
    },
  },

  defaultVariants: {
    variant: 'filled',
  },
})

type InternalVariant =
  | 'filled'
  | 'filledContrast'
  | 'outlined'
  | 'outlinedContrast'
  | 'text'

function resolveVariant(
  type: CardButtonType,
  contrast: boolean
): InternalVariant {
  if (type === 'text') return 'text'
  if (type === 'outlined') return contrast ? 'outlinedContrast' : 'outlined'
  return contrast ? 'filledContrast' : 'filled'
}

function resolveLabelColor(variant: InternalVariant): TypographyProps['color'] {
  if (variant === 'filled') return '$white100'
  if (variant === 'filledContrast') return '$backgroundPrimary'
  if (variant === 'outlinedContrast') return '$backgroundPrimary'

  return '$foregroundPrimary'
}

type CardButtonFrameProps = React.ComponentProps<typeof CardButtonFrame>

interface CardButtonProps extends Omit<CardButtonFrameProps, 'children'> {
  readonly children: string
  readonly type?: CardButtonType
  readonly contrast?: boolean
}

export function CardButton({
  children,
  type = 'filled',
  contrast = false,
  ...rest
}: CardButtonProps): React.JSX.Element {
  const variant = resolveVariant(type, contrast)

  return (
    <CardButtonFrame variant={variant} {...rest}>
      <Typography variant="descriptionBold" color={resolveLabelColor(variant)}>
        {children}
      </Typography>
    </CardButtonFrame>
  )
}

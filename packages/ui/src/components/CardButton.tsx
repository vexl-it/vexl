import React from 'react'
import {styled} from 'tamagui'

import {SizableText, Stack} from '../primitives'

type CardButtonType = 'filled' | 'text'

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
      },
      filledContrast: {
        backgroundColor: '$foregroundPrimary',
      },
      text: {
        backgroundColor: 'transparent',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'filled',
  },
})

const CardButtonLabel = styled(SizableText, {
  name: 'CardButtonLabel',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: '$2',
  letterSpacing: '$2',

  variants: {
    variant: {
      filled: {
        color: '$white100',
      },
      filledContrast: {
        color: '$backgroundPrimary',
      },
      text: {
        color: '$foregroundPrimary',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'filled',
  },
})

type InternalVariant = 'filled' | 'filledContrast' | 'text'

function resolveVariant(
  type: CardButtonType,
  contrast: boolean
): InternalVariant {
  if (type === 'text') return 'text'
  return contrast ? 'filledContrast' : 'filled'
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
      <CardButtonLabel variant={variant}>{children}</CardButtonLabel>
    </CardButtonFrame>
  )
}

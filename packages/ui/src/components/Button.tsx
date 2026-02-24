import React from 'react'
import {styled} from 'tamagui'

import {SizableText, Stack} from '../primitives'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'tertiary'
  | 'disabled'
type ButtonSize = 'large' | 'medium' | 'small'

const ButtonFrame = styled(Stack, {
  name: 'Button',
  role: 'button',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: '$4',
  paddingVertical: '$0',

  pressStyle: {
    opacity: 0.7,
  },

  variants: {
    size: {
      large: {
        height: '$12',
        gap: '$3',
        borderRadius: '$5',
      },
      medium: {
        height: '$10',
        gap: '$2',
        borderRadius: '$5',
      },
      small: {
        height: '$9',
        gap: '$2',
        borderRadius: '$3',
      },
    },

    variant: {
      primary: {
        backgroundColor: '$accentYellowPrimary',
      },
      secondary: {
        backgroundColor: '$accentYellowSecondary',
      },
      destructive: {
        backgroundColor: '$redBackground',
      },
      tertiary: {
        backgroundColor: '$foregroundPrimary',
      },
      disabled: {
        backgroundColor: '$backgroundTertiary',
        pointerEvents: 'none',
      },
    },
  } as const,

  defaultVariants: {
    size: 'large',
    variant: 'primary',
  },
})

const ButtonLabel = styled(SizableText, {
  name: 'ButtonText',
  fontFamily: '$body',
  fontWeight: '600',

  variants: {
    size: {
      large: {
        fontSize: '$5',
        letterSpacing: '$5',
      },
      medium: {
        fontSize: '$2',
        letterSpacing: '$2',
      },
      small: {
        fontSize: '$2',
        letterSpacing: '$2',
      },
    },

    variant: {
      primary: {
        color: '$black100',
      },
      secondary: {
        color: '$accentHighlightPrimary',
      },
      destructive: {
        color: '$white100',
      },
      tertiary: {
        color: '$backgroundPrimary',
      },
      disabled: {
        color: '$foregroundTertiary',
      },
    },
  } as const,

  defaultVariants: {
    size: 'large',
    variant: 'primary',
  },
})

type ButtonFrameProps = React.ComponentProps<typeof ButtonFrame>

interface ButtonProps extends Omit<ButtonFrameProps, 'children'> {
  readonly children: string
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
}

export function Button({
  children,
  variant = 'primary',
  size = 'large',
  ...rest
}: ButtonProps): React.JSX.Element {
  return (
    <ButtonFrame variant={variant} size={size} {...rest}>
      <ButtonLabel variant={variant} size={size}>
        {children}
      </ButtonLabel>
    </ButtonFrame>
  )
}

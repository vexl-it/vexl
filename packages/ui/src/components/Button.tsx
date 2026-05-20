import React from 'react'
import {styled, useTheme} from 'tamagui'

import type {IconProps} from '../icons/types'
import {SizableText, Stack} from '../primitives'

export type ButtonVariant =
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
  flexShrink: 1,
  textAlign: 'center',

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
  readonly icon?: React.ComponentType<IconProps>
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
}

export function Button({
  children,
  icon: Icon,
  variant = 'primary',
  size = 'large',
  ...rest
}: ButtonProps): React.JSX.Element {
  const theme = useTheme()
  const variantOrDisabled: ButtonVariant = rest.disabled ? 'disabled' : variant
  const iconColor =
    variantOrDisabled === 'primary'
      ? theme.black100.get()
      : variantOrDisabled === 'secondary'
        ? theme.accentHighlightPrimary.get()
        : variantOrDisabled === 'destructive'
          ? theme.white100.get()
          : variantOrDisabled === 'tertiary'
            ? theme.backgroundPrimary.get()
            : theme.foregroundTertiary.get()
  const iconSize = size === 'large' ? 24 : size === 'medium' ? 20 : 18

  return (
    <ButtonFrame variant={variantOrDisabled} size={size} {...rest}>
      {Icon ? <Icon color={iconColor} size={iconSize} /> : null}
      <ButtonLabel
        variant={variantOrDisabled}
        size={size}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {children}
      </ButtonLabel>
    </ButtonFrame>
  )
}

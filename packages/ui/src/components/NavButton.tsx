import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import {disabledOpacity} from '../config/tokens'
import type {IconProps} from '../icons/types'
import {Stack} from '../primitives'
import {Dot} from './Dot'
import {Typography} from './Typography'

export type NavButtonVariant =
  | 'accent'
  | 'highlighted'
  | 'destructive'
  | 'normal'
  | 'secondary'
  | 'transparent'

const NavButtonFrame = styled(Stack, {
  name: 'NavButton',
  role: 'button',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '$3',
  overflow: 'visible',

  pressStyle: {
    opacity: 0.7,
  },

  variants: {
    type: {
      icon: {
        padding: '$0',
      },
      text: {
        paddingHorizontal: '$4',
        paddingVertical: '$0',
      },
    },

    size: {
      medium: {
        height: '$9',
        minWidth: '$9',
      },
      // Matches the SearchBar height, for buttons placed next to a search field.
      large: {
        height: '$10',
        minWidth: '$10',
      },
    },

    variant: {
      accent: {
        backgroundColor: '$accentYellowPrimary',
      },
      highlighted: {
        backgroundColor: '$accentYellowSecondary',
      },
      destructive: {
        backgroundColor: '$redBackground',
      },
      normal: {
        backgroundColor: '$backgroundTertiary',
      },
      secondary: {
        backgroundColor: '$backgroundSecondary',
      },
      transparent: {
        backgroundColor: 'transparent',
      },
    },
  } as const,

  defaultVariants: {
    type: 'icon',
    variant: 'highlighted',
    size: 'medium',
  },
})

const contentColor = {
  accent: 'black100',
  highlighted: 'accentHighlightSecondary',
  destructive: 'white100',
  normal: 'foregroundPrimary',
  secondary: 'foregroundPrimary',
  transparent: 'foregroundPrimary',
} as const satisfies Record<NavButtonVariant, string>

type NavButtonFrameProps = React.ComponentProps<typeof NavButtonFrame>

type NavButtonBaseProps = Omit<
  NavButtonFrameProps,
  'children' | 'type' | 'variant'
> & {
  readonly variant?: NavButtonVariant
  readonly disabled?: boolean
}

interface NavButtonIconProps extends NavButtonBaseProps {
  readonly type?: 'icon'
  readonly icon: React.ComponentType<IconProps>
  /** Shows a small accent dot in the top right corner. */
  readonly badge?: boolean
}

interface NavButtonTextProps extends NavButtonBaseProps {
  readonly type: 'text'
  readonly children: string
}

export type NavButtonProps = NavButtonIconProps | NavButtonTextProps

export function NavButton(props: NavButtonProps): React.JSX.Element {
  const theme = useTheme()
  const variant = props.variant ?? 'highlighted'
  const disabled = props.disabled ?? false
  const colorKey = contentColor[variant]

  if (props.type === 'text') {
    const {
      type: _type,
      variant: _variant,
      disabled: _disabled,
      children,
      ...rest
    } = props
    return (
      <NavButtonFrame
        variant={variant}
        type="text"
        disabled={disabled}
        opacity={disabled ? disabledOpacity : 1}
        {...rest}
      >
        <Typography variant="paragraphSmallBold" color={`$${colorKey}`}>
          {children}
        </Typography>
      </NavButtonFrame>
    )
  }

  const {
    type: _type,
    variant: _variant,
    disabled: _disabled,
    badge = false,
    icon: Icon,
    ...rest
  } = props
  return (
    <NavButtonFrame
      variant={variant}
      type="icon"
      disabled={disabled}
      opacity={disabled ? disabledOpacity : 1}
      {...rest}
    >
      <Icon color={theme[colorKey].get()} size={getTokens().size.$7.val} />
      {badge ? (
        <Dot
          position="absolute"
          top="$-2"
          right="$-2"
          size="$5"
          backgroundColor="$accentYellowPrimary"
        />
      ) : null}
    </NavButtonFrame>
  )
}

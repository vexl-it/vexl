import React from 'react'
import {getTokens, styled, useTheme} from 'tamagui'

import type {IconProps} from '../icons/types'
import {Stack} from '../primitives'
import {Typography, type TypographyVariant} from './Typography'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'tertiary'
  | 'disabled'
  /** Text-only button without a background, for inline links. */
  | 'link'
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

const LinkFrame = styled(Stack, {
  name: 'ButtonLink',
  role: 'button',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$2',

  pressStyle: {
    opacity: 0.7,
  },
})

const contentColor = {
  primary: 'black100',
  secondary: 'accentHighlightPrimary',
  destructive: 'white100',
  tertiary: 'backgroundPrimary',
  disabled: 'foregroundTertiary',
  link: 'accentHighlightPrimary',
} as const satisfies Record<ButtonVariant, string>

const labelVariant = {
  large: 'titlesSmall',
  medium: 'descriptionBold',
  small: 'descriptionBold',
} as const satisfies Record<ButtonSize, TypographyVariant>

const linkLabelVariant = {
  large: 'paragraphDemibold',
  medium: 'paragraphSmallBold',
  small: 'descriptionBold',
} as const satisfies Record<ButtonSize, TypographyVariant>

const iconSizeToken = {
  large: '$7',
  medium: '$6',
  small: '$5.5',
} as const satisfies Record<
  ButtonSize,
  keyof ReturnType<typeof getTokens>['size']
>

type ButtonFrameProps = React.ComponentProps<typeof ButtonFrame>

interface ButtonProps extends Omit<
  ButtonFrameProps,
  'children' | 'variant' | 'size'
> {
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
  const iconSize = getTokens().size[iconSizeToken[size]].val
  const colorKey = contentColor[rest.disabled ? 'disabled' : variant]

  if (variant === 'link') {
    return (
      <LinkFrame opacity={rest.disabled ? 0.4 : 1} {...rest}>
        {Icon ? (
          <Icon color={theme[contentColor.link].get()} size={iconSize} />
        ) : null}
        <Typography
          variant={linkLabelVariant[size]}
          color={`$${contentColor.link}`}
        >
          {children}
        </Typography>
      </LinkFrame>
    )
  }

  return (
    <ButtonFrame
      variant={rest.disabled ? 'disabled' : variant}
      size={size}
      {...rest}
    >
      {Icon ? <Icon color={theme[colorKey].get()} size={iconSize} /> : null}
      <Typography
        variant={labelVariant[size]}
        color={`$${colorKey}`}
        flexShrink={1}
        textAlign="center"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {children}
      </Typography>
    </ButtonFrame>
  )
}

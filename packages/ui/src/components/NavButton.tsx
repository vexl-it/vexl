import React from 'react'
import {styled, useTheme} from 'tamagui'

import type {IconProps} from '../icons/types'
import {SizableText, Stack} from '../primitives'

export type NavButtonVariant = 'highlighted' | 'destructive' | 'normal'

const NavButtonFrame = styled(Stack, {
  name: 'NavButton',
  role: 'button',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '$3',

  pressStyle: {
    opacity: 0.7,
  },

  variants: {
    type: {
      icon: {
        width: '$9',
        height: '$9',
        padding: '$0',
      },
      text: {
        height: '$9',
        paddingHorizontal: '$4',
        paddingVertical: '$0',
      },
    },

    variant: {
      highlighted: {
        backgroundColor: '$accentYellowSecondary',
      },
      destructive: {
        backgroundColor: '$redBackground',
      },
      normal: {
        backgroundColor: '$backgroundTertiary',
      },
    },
  } as const,

  defaultVariants: {
    type: 'icon',
    variant: 'highlighted',
  },
})

const NavButtonLabel = styled(SizableText, {
  name: 'NavButtonLabel',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: '$3',
  letterSpacing: '$3',

  variants: {
    variant: {
      highlighted: {
        color: '$accentHighlightSecondary',
      },
      destructive: {
        color: '$white100',
      },
      normal: {
        color: '$foregroundPrimary',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'highlighted',
  },
})

type NavButtonFrameProps = React.ComponentProps<typeof NavButtonFrame>

type NavButtonBaseProps = Omit<
  NavButtonFrameProps,
  'children' | 'type' | 'variant'
> & {
  readonly variant?: NavButtonVariant
}

interface NavButtonIconProps extends NavButtonBaseProps {
  readonly type?: 'icon'
  readonly icon: React.ComponentType<IconProps>
}

interface NavButtonTextProps extends NavButtonBaseProps {
  readonly type: 'text'
  readonly children: string
}

export type NavButtonProps = NavButtonIconProps | NavButtonTextProps

export function NavButton(props: NavButtonProps): React.JSX.Element {
  const theme = useTheme()
  const variant = props.variant ?? 'highlighted'

  const iconColor =
    variant === 'highlighted'
      ? theme.accentHighlightSecondary.val
      : variant === 'destructive'
        ? theme.white100.val
        : theme.foregroundPrimary.val

  if (props.type === 'text') {
    const {type: _, variant: __, children, ...rest} = props
    return (
      <NavButtonFrame variant={variant} type="text" {...rest}>
        <NavButtonLabel variant={variant}>{children}</NavButtonLabel>
      </NavButtonFrame>
    )
  }

  const {type: _, variant: __, icon: Icon, ...rest} = props
  return (
    <NavButtonFrame variant={variant} type="icon" {...rest}>
      <Icon color={iconColor} size={24} />
    </NavButtonFrame>
  )
}

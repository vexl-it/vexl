import React from 'react'
import {styled} from 'tamagui'

import {SizableText, Stack, Theme} from '../primitives'

type NavButtonVariant = 'highlighted' | 'destructive' | 'normal'
type NavButtonType = 'icon' | 'text'

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

interface NavButtonProps extends Omit<NavButtonFrameProps, 'children'> {
  readonly children: React.ReactNode
  readonly variant?: NavButtonVariant
  readonly type?: NavButtonType
}

export function NavButton({
  children,
  variant = 'highlighted',
  type = 'icon',
  ...rest
}: NavButtonProps): React.JSX.Element {
  const content = (
    <NavButtonFrame variant={variant} type={type} {...rest}>
      {type === 'text' ? (
        <NavButtonLabel variant={variant}>{children}</NavButtonLabel>
      ) : (
        children
      )}
    </NavButtonFrame>
  )

  // Normal variant always renders in light mode per Figma design
  if (variant === 'normal') {
    return <Theme name="light">{content}</Theme>
  }

  return content
}

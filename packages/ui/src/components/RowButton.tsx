import React from 'react'
import {styled, useTheme} from 'tamagui'

import type {IconProps} from '../icons/types'
import {SizableText, XStack} from '../primitives'

const RowButtonFrame = styled(XStack, {
  name: 'RowButton',
  role: 'button',
  alignItems: 'center',
  gap: '$3',
  height: '$11',
  paddingHorizontal: '$5',
  borderRadius: '$5',
  backgroundColor: '$backgroundSecondary',

  variants: {
    selected: {
      true: {
        backgroundColor: '$accentYellowSecondary',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
})

const RowButtonLabel = styled(SizableText, {
  name: 'RowButtonLabel',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$4',
  letterSpacing: '$4',
  color: '$accentHighlightPrimary',
  flex: 1,

  variants: {
    selected: {
      true: {
        color: '$accentHighlightSecondary',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
})

type RowButtonFrameProps = React.ComponentProps<typeof RowButtonFrame>

export interface RowButtonProps extends Omit<RowButtonFrameProps, 'children'> {
  readonly label: string
  readonly selected?: boolean
  readonly icon?: React.ComponentType<IconProps>
}

export function RowButton({
  label,
  selected = false,
  icon: Icon,
  ...rest
}: RowButtonProps): React.JSX.Element {
  const theme = useTheme()
  const iconColor = selected
    ? theme.accentHighlightSecondary.val
    : theme.accentHighlightPrimary.val

  return (
    <RowButtonFrame selected={selected} {...rest}>
      {Icon ? <Icon color={iconColor} size={24} /> : null}
      <RowButtonLabel selected={selected}>{label}</RowButtonLabel>
    </RowButtonFrame>
  )
}

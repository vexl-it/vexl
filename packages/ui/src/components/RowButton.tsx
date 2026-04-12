import React from 'react'
import {styled, useTheme} from 'tamagui'

import type {IconProps} from '../icons/types'
import {XStack} from '../primitives'
import {Typography} from './Typography'

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

type RowButtonFrameProps = React.ComponentProps<typeof RowButtonFrame>

interface RowButtonBaseProps
  extends Omit<RowButtonFrameProps, 'children' | 'onPress'> {
  readonly label: string
  readonly selected?: boolean
  readonly icon?: React.ComponentType<IconProps>
}

interface RowButtonWithValueProps<T> extends RowButtonBaseProps {
  readonly value: T
  readonly onPress: (value: T) => void
}

interface RowButtonWithoutValueProps extends RowButtonBaseProps {
  readonly onPress: () => void
}

export type RowButtonProps<T = never> =
  | RowButtonWithValueProps<T>
  | RowButtonWithoutValueProps

function hasValue<T>(
  props: RowButtonProps<T>
): props is RowButtonWithValueProps<T> {
  return 'value' in props
}

export function RowButton<T>(props: RowButtonProps<T>): React.JSX.Element {
  const {label, selected = false, icon: Icon} = props
  const theme = useTheme()
  const iconColor = selected
    ? theme.accentHighlightSecondary.val
    : theme.accentHighlightPrimary.val

  const handlePress = (): void => {
    if (hasValue(props)) {
      props.onPress(props.value)
    } else {
      props.onPress()
    }
  }

  return (
    <RowButtonFrame selected={selected} onPress={handlePress}>
      {Icon ? <Icon color={iconColor} size={24} /> : null}
      <Typography
        variant="paragraph"
        color={
          selected ? '$accentHighlightSecondary' : '$accentHighlightPrimary'
        }
        flex={1}
      >
        {label}
      </Typography>
    </RowButtonFrame>
  )
}

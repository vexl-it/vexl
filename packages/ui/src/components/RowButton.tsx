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
export type RowButtonVariant = 'default' | 'red'

interface RowButtonBaseProps
  extends Omit<RowButtonFrameProps, 'children' | 'onPress'> {
  readonly label: string
  readonly selected?: boolean
  readonly icon?: React.ComponentType<IconProps>
  readonly variant?: RowButtonVariant
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
  const {label, selected = false, icon: Icon, variant = 'default'} = props
  const theme = useTheme()
  const iconColor =
    variant === 'red'
      ? theme.redForeground.val
      : selected
        ? theme.accentHighlightSecondary.val
        : theme.accentHighlightPrimary.val
  const labelSelected = variant === 'red' ? false : selected

  const handlePress = (): void => {
    if (hasValue(props)) {
      props.onPress(props.value)
    } else {
      props.onPress()
    }
  }

  const frameProps = getFrameProps(props)

  return (
    <RowButtonFrame {...frameProps} selected={selected} onPress={handlePress}>
      {Icon ? <Icon color={iconColor} size={24} /> : null}
      <Typography
        variant="paragraph"
        color={getLabelColor(variant, labelSelected)}
        flex={1}
      >
        {label}
      </Typography>
    </RowButtonFrame>
  )
}

function getLabelColor(
  variant: RowButtonVariant,
  selected: boolean
): '$redForeground' | '$accentHighlightSecondary' | '$accentHighlightPrimary' {
  if (variant === 'red') return '$redForeground'

  return selected ? '$accentHighlightSecondary' : '$accentHighlightPrimary'
}

function getFrameProps<T>(props: RowButtonProps<T>): RowButtonFrameProps {
  if (hasValue(props)) {
    const {label, selected, icon, variant, value, onPress, ...rest} = props
    return rest
  }

  const {label, selected, icon, variant, onPress, ...rest} = props
  return rest
}

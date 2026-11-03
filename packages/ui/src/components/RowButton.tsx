import React from 'react'
import {type GestureResponderEvent} from 'react-native'
import {getTokens, useTheme} from 'tamagui'

import type {IconProps} from '../icons/types'
import {NavButton} from './NavButton'
import {SelectionRowFrame} from './SelectionRow'
import {Typography} from './Typography'

type RowButtonFrameProps = React.ComponentProps<typeof SelectionRowFrame>
export type RowButtonVariant = 'default' | 'red'

interface RowButtonBaseProps extends Omit<
  RowButtonFrameProps,
  'children' | 'onPress'
> {
  readonly label: string
  readonly selected?: boolean
  readonly icon?: React.ComponentType<IconProps>
  readonly variant?: RowButtonVariant
  /** Secondary icon action on the right side of the row, e.g. remove. */
  readonly trailingAction?: RowButtonTrailingAction
}

export interface RowButtonTrailingAction {
  readonly icon: React.ComponentType<IconProps>
  readonly onPress: () => void
  readonly accessibilityLabel?: string
}

interface RowButtonWithValueProps<T> extends RowButtonBaseProps {
  readonly value: T
  readonly onPress: (value: T) => void
}

interface RowButtonWithoutValueProps extends RowButtonBaseProps {
  readonly onPress?: () => void
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
  const {
    label,
    selected = false,
    icon: Icon,
    variant = 'default',
    trailingAction,
  } = props
  const theme = useTheme()
  const iconColor =
    variant === 'red'
      ? theme.redForeground.get()
      : selected
        ? theme.accentHighlightSecondary.get()
        : theme.accentHighlightPrimary.get()
  const labelSelected = variant === 'red' ? false : selected

  const handlePress = (): void => {
    if (hasValue(props)) {
      props.onPress(props.value)
    } else {
      props.onPress?.()
    }
  }

  const handleTrailingPress = (event: GestureResponderEvent): void => {
    event.stopPropagation()
    trailingAction?.onPress()
  }

  const frameProps = getFrameProps(props)

  return (
    <SelectionRowFrame
      role="button"
      paddingVertical={trailingAction ? '$3' : undefined}
      paddingRight={trailingAction ? '$3' : undefined}
      {...frameProps}
      selected={selected}
      onPress={handlePress}
    >
      {Icon ? <Icon color={iconColor} size={getTokens().size.$7.val} /> : null}
      <Typography
        variant="paragraph"
        color={getLabelColor(variant, labelSelected)}
        flex={1}
        numberOfLines={2}
      >
        {label}
      </Typography>
      {trailingAction ? (
        <NavButton
          variant="transparent"
          icon={trailingAction.icon}
          aria-label={trailingAction.accessibilityLabel}
          onPress={handleTrailingPress}
        />
      ) : null}
    </SelectionRowFrame>
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
    const {
      label,
      selected,
      icon,
      variant,
      trailingAction,
      value,
      onPress,
      ...rest
    } = props
    return rest
  }

  const {label, selected, icon, variant, trailingAction, onPress, ...rest} =
    props
  return rest
}

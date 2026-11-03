import React from 'react'
import {Checkbox, getTokens} from 'tamagui'

import {CheckboxFilled} from '../icons/CheckboxFilled'
import {SquareOutline} from '../icons/SquareOutline'
import {
  SelectionRowFrame,
  SelectionRowText,
  useSelectionRowIconColor,
} from './SelectionRow'

type SelectionRowFrameProps = React.ComponentProps<typeof SelectionRowFrame>

export interface RowCheckboxProps extends Omit<
  SelectionRowFrameProps,
  'children' | 'selected'
> {
  readonly label: string
  readonly description?: string
  readonly checked?: boolean
  readonly onCheckedChange?: (checked: boolean) => void
}

export function RowCheckbox({
  label,
  description,
  checked = false,
  onCheckedChange,
  ...rest
}: RowCheckboxProps): React.JSX.Element {
  const iconColor = useSelectionRowIconColor(checked)
  const iconSize = getTokens().size.$7.val
  const Indicator = checked ? CheckboxFilled : SquareOutline

  return (
    <SelectionRowFrame
      role="button"
      selected={checked}
      onPress={() => {
        onCheckedChange?.(!checked)
      }}
      {...rest}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(next) => {
          if (typeof next === 'boolean') {
            onCheckedChange?.(next)
          }
        }}
        unstyled
        width="$7"
        height="$7"
        backgroundColor="transparent"
        borderWidth={0}
        padding="$0"
      >
        <Checkbox.Indicator forceMount>
          <Indicator size={iconSize} color={iconColor} />
        </Checkbox.Indicator>
      </Checkbox>
      <SelectionRowText
        selected={checked}
        label={label}
        description={description}
      />
    </SelectionRowFrame>
  )
}

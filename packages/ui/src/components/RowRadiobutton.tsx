import React from 'react'
import {RadioGroup as TamaguiRadioGroup, getTokens} from 'tamagui'

import {disabledOpacity} from '../config/tokens'
import {RadiobuttonCircleEmpty} from '../icons/RadiobuttonCircleEmpty'
import {RadiobuttonCircleFilled} from '../icons/RadiobuttonCircleFilled'
import {useRadioGroupSelectedValuePress, useRadioGroupValue} from './RadioGroup'
import {
  SelectionRowFrame,
  SelectionRowText,
  useSelectionRowIconColor,
} from './SelectionRow'

export interface RowRadiobuttonProps<T extends string = string> {
  readonly value: T
  readonly label: string
  readonly description?: string
  readonly disabled?: boolean
}

export function RowRadiobutton<T extends string>({
  value,
  label,
  description,
  disabled,
}: RowRadiobuttonProps<T>): React.JSX.Element {
  const radioGroupValue = useRadioGroupValue()
  const onSelectedValuePress = useRadioGroupSelectedValuePress()
  const selected = radioGroupValue === value
  const iconColor = useSelectionRowIconColor(selected)
  const Indicator = selected ? RadiobuttonCircleFilled : RadiobuttonCircleEmpty

  return (
    <TamaguiRadioGroup.Item
      value={value}
      disabled={disabled}
      unstyled
      borderWidth={0}
      padding={0}
      backgroundColor="transparent"
      pressStyle={{opacity: 0.7}}
      onPress={() => {
        if (selected) onSelectedValuePress?.(value)
      }}
    >
      <SelectionRowFrame
        selected={selected}
        pressable={false}
        opacity={disabled ? disabledOpacity : 1}
      >
        <Indicator size={getTokens().size.$7.val} color={iconColor} />
        <SelectionRowText
          selected={selected}
          label={label}
          description={description}
        />
      </SelectionRowFrame>
    </TamaguiRadioGroup.Item>
  )
}

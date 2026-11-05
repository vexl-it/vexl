import React from 'react'
import {Checkbox, getTokens, useTheme} from 'tamagui'

import {CheckboxFilled} from '../icons/CheckboxFilled'
import {RadiobuttonCircleEmpty} from '../icons/RadiobuttonCircleEmpty'
import {RadiobuttonCircleFilled} from '../icons/RadiobuttonCircleFilled'
import {SquareOutline} from '../icons/SquareOutline'
import type {IconProps} from '../icons/types'
import {
  SelectionRowFrame,
  SelectionRowText,
  useSelectionRowIconColor,
} from './SelectionRow'
import {Typography} from './Typography'

type RowCheckboxShape = 'square' | 'circle'

const indicators: Record<
  RowCheckboxShape,
  Record<'checked' | 'unchecked', React.ComponentType<IconProps>>
> = {
  square: {checked: CheckboxFilled, unchecked: SquareOutline},
  circle: {checked: RadiobuttonCircleFilled, unchecked: RadiobuttonCircleEmpty},
}

type SelectionRowFrameProps = React.ComponentProps<typeof SelectionRowFrame>

const compactFrameProps = {
  padding: '$0',
  gap: '$2',
  minHeight: 0,
  alignSelf: 'flex-start',
  backgroundColor: 'transparent',
} as const satisfies SelectionRowFrameProps

export interface RowCheckboxProps extends Omit<
  SelectionRowFrameProps,
  'children' | 'selected'
> {
  readonly label: string
  readonly description?: string
  readonly checked?: boolean
  readonly onCheckedChange?: (checked: boolean) => void
  /** Inline checkbox with a small label, without the row background. */
  readonly compact?: boolean
  readonly shape?: RowCheckboxShape
}

export function RowCheckbox({
  label,
  description,
  checked = false,
  onCheckedChange,
  compact = false,
  shape = 'square',
  ...rest
}: RowCheckboxProps): React.JSX.Element {
  const theme = useTheme()
  const rowIconColor = useSelectionRowIconColor(checked)
  const compactIconColor = checked
    ? theme.accentHighlightSecondary.get()
    : theme.foregroundSecondary.get()
  const iconColor = compact ? compactIconColor : rowIconColor
  const iconSizeToken = compact ? '$5.5' : '$7'
  const Indicator = indicators[shape][checked ? 'checked' : 'unchecked']

  return (
    <SelectionRowFrame
      role="button"
      selected={checked}
      onPress={() => {
        onCheckedChange?.(!checked)
      }}
      {...(compact ? compactFrameProps : undefined)}
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
        width={iconSizeToken}
        height={iconSizeToken}
        backgroundColor="transparent"
        borderWidth={0}
        padding="$0"
      >
        <Checkbox.Indicator forceMount>
          <Indicator
            size={getTokens().size[iconSizeToken].val}
            color={iconColor}
          />
        </Checkbox.Indicator>
      </Checkbox>
      {compact ? (
        <Typography variant="micro" color="$foregroundSecondary">
          {label}
        </Typography>
      ) : (
        <SelectionRowText
          selected={checked}
          label={label}
          description={description}
        />
      )}
    </SelectionRowFrame>
  )
}

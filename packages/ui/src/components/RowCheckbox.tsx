import React from 'react'
import {Checkbox, getTokens, useTheme} from 'tamagui'

import {CheckboxFilled} from '../icons/CheckboxFilled'
import {SquareOutline} from '../icons/SquareOutline'
import {
  SelectionRowFrame,
  SelectionRowText,
  useSelectionRowIconColor,
} from './SelectionRow'
import {Typography} from './Typography'

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
}

export function RowCheckbox({
  label,
  description,
  checked = false,
  onCheckedChange,
  compact = false,
  ...rest
}: RowCheckboxProps): React.JSX.Element {
  const theme = useTheme()
  const rowIconColor = useSelectionRowIconColor(checked)
  const iconColor =
    compact && !checked ? theme.foregroundSecondary.get() : rowIconColor
  const iconSizeToken = compact ? '$5.5' : '$7'
  const Indicator = checked ? CheckboxFilled : SquareOutline

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

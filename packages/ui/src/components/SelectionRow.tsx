import React from 'react'
import {styled, useTheme} from 'tamagui'

import {YStack} from '../primitives'
import {FieldFrame} from './Field'
import {Typography} from './Typography'

export const SelectionRowFrame = styled(FieldFrame, {
  name: 'SelectionRow',
  padding: '$5',
  borderWidth: 0,
  pressable: true,
})

function selectionRowColor(
  selected: boolean
): '$accentHighlightPrimary' | '$foregroundPrimary' {
  return selected ? '$accentHighlightPrimary' : '$foregroundPrimary'
}

export function useSelectionRowIconColor(selected: boolean): string {
  const theme = useTheme()
  return selected
    ? theme.accentHighlightPrimary.get()
    : theme.foregroundPrimary.get()
}

export function SelectionRowText({
  selected,
  label,
  description,
}: {
  readonly selected: boolean
  readonly label: string
  readonly description?: string
}): React.JSX.Element {
  const color = selectionRowColor(selected)

  return (
    <YStack flex={1} gap="$1">
      <Typography variant="paragraph" color={color}>
        {label}
      </Typography>
      {description ? (
        <Typography variant="description" color={color}>
          {description}
        </Typography>
      ) : null}
    </YStack>
  )
}

import React from 'react'
import {styled, useTheme} from 'tamagui'

import {XStack, YStack} from '../primitives'
import {Typography} from './Typography'

export const SelectionRowFrame = styled(XStack, {
  name: 'SelectionRow',
  alignItems: 'center',
  gap: '$3',
  padding: '$5',
  borderRadius: '$5',
  backgroundColor: '$backgroundSecondary',

  pressStyle: {
    opacity: 0.7,
  },

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

export function selectionRowColor(
  selected: boolean
): '$accentHighlightSecondary' | '$foregroundPrimary' {
  return selected ? '$accentHighlightSecondary' : '$foregroundPrimary'
}

export function useSelectionRowIconColor(selected: boolean): string {
  const theme = useTheme()
  return selected
    ? theme.accentHighlightSecondary.get()
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
  return (
    <YStack flex={1} gap="$1">
      <Typography variant="paragraph" color={selectionRowColor(selected)}>
        {label}
      </Typography>
      {description ? (
        <Typography
          variant="description"
          color={
            selected ? '$accentHighlightSecondary' : '$foregroundSecondary'
          }
        >
          {description}
        </Typography>
      ) : null}
    </YStack>
  )
}

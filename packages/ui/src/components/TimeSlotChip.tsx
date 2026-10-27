import React from 'react'
import {TouchableOpacity} from 'react-native'
import {useTheme} from 'tamagui'

import {Stack} from '../primitives'
import {Typography} from './Typography'

export interface TimeSlotChipProps {
  /** E.g. "14:30". */
  readonly label: string
  readonly selected: boolean
  readonly onPress: () => void
}

export function TimeSlotChip({
  label,
  selected,
  onPress,
}: TimeSlotChipProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Stack
        minWidth={72}
        paddingHorizontal="$5"
        paddingVertical="$4"
        borderRadius="$3"
        backgroundColor={
          selected
            ? theme.accentYellowPrimary.get()
            : theme.backgroundTertiary.get()
        }
        alignItems="center"
        justifyContent="center"
      >
        <Typography
          variant="paragraphSmall"
          color={selected ? '$black100' : '$foregroundSecondary'}
        >
          {label}
        </Typography>
      </Stack>
    </TouchableOpacity>
  )
}

import React from 'react'

import {XStack, YStack} from '../primitives'
import {Typography} from './Typography'

export interface TimeSlotGroupProps {
  /** E.g. "Morning". */
  readonly title: string
  /** `TimeSlotChip`s, wrapped into rows. */
  readonly children: React.ReactNode
}

export function TimeSlotGroup({
  title,
  children,
}: TimeSlotGroupProps): React.JSX.Element {
  return (
    <YStack gap="$3" mb="$3">
      <Typography variant="paragraphSmall" color="$foregroundPrimary">
        {title}
      </Typography>
      <XStack flexWrap="wrap" gap="$3" rowGap="$3">
        {children}
      </XStack>
    </YStack>
  )
}

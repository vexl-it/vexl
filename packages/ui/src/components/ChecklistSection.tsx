import React from 'react'

import {Stack} from '../primitives'
import {Typography} from './Typography'

export interface ChecklistSectionProps {
  readonly title: string
  /** Usually `ChecklistCell`s, stacked with a small gap. */
  readonly children: React.ReactNode
}

export function ChecklistSection({
  title,
  children,
}: ChecklistSectionProps): React.JSX.Element {
  return (
    <Stack gap="$3">
      <Typography variant="paragraphSmall" color="$foregroundPrimary">
        {title}
      </Typography>
      <Stack gap="$2">{children}</Stack>
    </Stack>
  )
}

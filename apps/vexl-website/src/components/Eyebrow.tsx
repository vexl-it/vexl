'use client'

import {Typography, XStack} from '@vexl-next/ui'
import React from 'react'

/** Short label above a section headline, on a yellow highlight. */
export function Eyebrow({
  children,
  center = false,
}: {
  readonly children: string
  readonly center?: boolean
}): React.JSX.Element {
  return (
    <XStack
      alignSelf={center ? 'center' : 'flex-start'}
      paddingHorizontal="$3"
      paddingVertical="$1"
      borderRadius="$11"
      backgroundColor="$accentYellowPrimary"
    >
      <Typography variant="descriptionBold" color="$black100">
        {children}
      </Typography>
    </XStack>
  )
}

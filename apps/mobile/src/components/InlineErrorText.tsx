import {Typography} from '@vexl-next/ui'
import React from 'react'

export default function InlineErrorText({
  children,
}: {
  readonly children: string | undefined
}): React.ReactElement | null {
  if (children === undefined) return null

  return (
    <Typography
      color="$redForeground"
      textAlign="center"
      variant="paragraphSmall"
    >
      {children}
    </Typography>
  )
}

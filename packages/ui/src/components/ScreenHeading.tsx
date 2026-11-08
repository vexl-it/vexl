import React from 'react'

import {YStack} from '../primitives'
import {Typography} from './Typography'

export interface ScreenHeadingProps {
  readonly title: string
  readonly text: string
}

export function ScreenHeading({
  title,
  text,
}: ScreenHeadingProps): React.JSX.Element {
  return (
    <YStack alignItems="center" gap="$4" width="100%">
      <Typography
        color="$foregroundPrimary"
        textAlign="center"
        variant="heading3"
      >
        {title}
      </Typography>
      <Typography
        color="$foregroundSecondary"
        textAlign="center"
        variant="paragraphSmall"
      >
        {text}
      </Typography>
    </YStack>
  )
}

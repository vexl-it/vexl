import React from 'react'

import {YStack} from '../primitives'
import {Typography} from './Typography'

export interface ReplyPreviewProps extends Omit<
  React.ComponentProps<typeof YStack>,
  'children'
> {
  /** e.g. "Reply to" */
  readonly label: string
  /** The quoted message text. */
  readonly text?: string
  readonly image?: React.ReactNode
}

export function ReplyPreview({
  label,
  text,
  image,
  ...rest
}: ReplyPreviewProps): React.JSX.Element {
  return (
    <YStack gap="$1" {...rest}>
      {image}
      <Typography color="$foregroundSecondary" variant="micro">
        {label}
      </Typography>
      {text ? (
        <Typography color="$foregroundPrimary" variant="micro" marginTop="$1">
          {text}
        </Typography>
      ) : null}
    </YStack>
  )
}

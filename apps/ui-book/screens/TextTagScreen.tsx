import {TextTag, type TextTagVariant, Typography, XStack} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const regularVariants: readonly TextTagVariant[] = [
  'offer',
  'request',
  'neutral',
  'approved',
  'waiting',
  'new',
  'paused',
  'set',
  'accepted',
  'waitingForConfirmation',
  'outdated',
]

const statusVariants: readonly TextTagVariant[] = [
  'warning',
  'success',
  'expired',
  'failed',
]

function TagRow({
  variants,
}: {
  readonly variants: readonly TextTagVariant[]
}): React.JSX.Element {
  return (
    <XStack gap="$2" flexWrap="wrap">
      {pipe(
        variants,
        Array.map((variant) => (
          <TextTag key={variant} variant={variant} label={variant} />
        ))
      )}
    </XStack>
  )
}

function Demos(): React.JSX.Element {
  return (
    <>
      <Typography variant="descriptionBold" color="$foregroundSecondary">
        Regular
      </Typography>
      <TagRow variants={regularVariants} />
      <Typography variant="descriptionBold" color="$foregroundSecondary">
        Status (e.g. donation status)
      </Typography>
      <TagRow variants={statusVariants} />
    </>
  )
}

export function TextTagScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Text Tag" demos={Demos} />
}

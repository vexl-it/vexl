import {Backdrop, type BackdropVariant, Typography, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function BackdropDemo({
  variant,
}: {
  readonly variant: BackdropVariant
}): React.JSX.Element {
  return (
    <YStack gap="$2">
      <Typography variant="description" color="$foregroundSecondary">
        {variant}
      </Typography>
      <YStack
        position="relative"
        height={120}
        borderRadius="$4"
        overflow="hidden"
        padding="$4"
        backgroundColor="$backgroundSecondary"
      >
        <Typography variant="paragraph" color="$foregroundPrimary">
          Content behind the backdrop
        </Typography>
        <Backdrop variant={variant} />
      </YStack>
    </YStack>
  )
}

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <BackdropDemo variant="dark" />
      <BackdropDemo variant="surface" />
    </YStack>
  )
}

export function BackdropScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Backdrop" demos={Demos} />
}

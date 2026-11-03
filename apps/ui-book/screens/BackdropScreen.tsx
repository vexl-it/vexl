import {Backdrop, type BackdropVariant, Typography, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function BackdropDemo({
  variant,
}: {
  readonly variant: BackdropVariant
}): React.JSX.Element {
  return (
    <DemoSection title={variant}>
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
    </DemoSection>
  )
}

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <BackdropDemo variant="dark" />
      <BackdropDemo variant="surface" />
    </YStack>
  )
}

export function BackdropScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Backdrop" demos={Demos} />
}

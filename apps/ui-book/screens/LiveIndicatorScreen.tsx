import {LiveIndicator, Typography, XStack, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <XStack alignItems="center" gap="$3">
        <LiveIndicator />
        <Typography variant="description" color="$foregroundPrimary">
          Default ($accentYellowPrimary)
        </Typography>
      </XStack>
      <XStack alignItems="center" gap="$3">
        <LiveIndicator color="$pinkForeground" />
        <Typography variant="description" color="$foregroundPrimary">
          $pinkForeground
        </Typography>
      </XStack>
      <XStack alignItems="center" gap="$3">
        <LiveIndicator color="$foregroundPrimary" />
        <Typography variant="description" color="$foregroundPrimary">
          $foregroundPrimary
        </Typography>
      </XStack>
    </YStack>
  )
}

export function LiveIndicatorScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Live Indicator" demos={Demos} />
}

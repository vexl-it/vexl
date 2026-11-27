import {ProgressBar, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <ProgressBar value={0} />
      <ProgressBar value={0.4} />
      <ProgressBar value={1} />
    </YStack>
  )
}

export function ProgressBarScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Progress Bar" demos={Demos} />
}

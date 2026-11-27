import {ReachLabel, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <ReachLabel label="23 people" />
      <ReachLabel label="−5 people" tone="loss" />
      <ReachLabel
        label="You'll lose about 11 people from your reach"
        tone="loss"
        size="medium"
      />
    </YStack>
  )
}

export function ReachLabelScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Reach Label" demos={Demos} />
}

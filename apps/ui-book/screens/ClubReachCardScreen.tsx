import {ClubReachCard, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$3">
      <ClubReachCard title="Bitcoin Prague" reachLabel="2,840 people" />
      <ClubReachCard
        title="Local makers and merchants"
        reachLabel="152 people in your extended network"
      />
    </YStack>
  )
}

export function ClubReachCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Club Reach Card" demos={Demos} />
}

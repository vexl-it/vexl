import {RevealDeclinedCard, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const vexlAvatarSource = require('../assets/vexlAvatar.png')

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <RevealDeclinedCard
        imageSource={vexlAvatarSource}
        title="They declined the request"
        description="Nothing was shared."
      />
      <RevealDeclinedCard
        imageSource={vexlAvatarSource}
        title="You declined the request"
        description="Nothing was shared."
      />
    </YStack>
  )
}

export function RevealDeclinedCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Reveal Declined Card" demos={Demos} />
}

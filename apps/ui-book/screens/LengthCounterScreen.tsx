import {LengthCounter, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <LengthCounter length={0} maxLength={40} />
      <LengthCounter length={12} maxLength={40} />
      <LengthCounter length={40} maxLength={40} />
    </YStack>
  )
}

export function LengthCounterScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Length Counter" demos={Demos} />
}

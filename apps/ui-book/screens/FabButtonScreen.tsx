import {FabButton, Gift, PlusAdd, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4" alignItems="flex-start">
      <FabButton icon={PlusAdd} label="My new offer" onPress={() => {}} />
      <FabButton icon={Gift} label="Donate" onPress={() => {}} />
    </YStack>
  )
}

export function FabButtonScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Fab Button" demos={Demos} />
}

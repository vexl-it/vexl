import {FabButton, Gift, PlusAdd, Stack, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4" alignItems="flex-start">
      <FabButton icon={PlusAdd} label="My new offer" onPress={() => {}} />
      <FabButton icon={Gift} label="Donate" onPress={() => {}} />
      <Stack
        alignSelf="stretch"
        height="$13"
        borderRadius="$5"
        backgroundColor="$backgroundSecondary"
      >
        <FabButton
          floating
          icon={PlusAdd}
          label="Floating"
          onPress={() => {}}
        />
      </Stack>
    </YStack>
  )
}

export function FabButtonScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Fab Button" demos={Demos} />
}

import {DotTypingIndicator, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack
      alignSelf="center"
      padding="$5"
      backgroundColor="$backgroundSecondary"
      borderRadius="$4"
      alignItems="center"
      justifyContent="center"
    >
      <DotTypingIndicator />
    </YStack>
  )
}

export function DotTypingIndicatorScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Dot Typing Indicator" demos={Demos} />
}

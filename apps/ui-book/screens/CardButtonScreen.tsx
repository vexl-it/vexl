import {CardButton, XStack, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <DemoSection title="Filled">
        <XStack gap="$3">
          <CardButton onPress={() => {}}>Label</CardButton>
          <CardButton contrast onPress={() => {}}>
            Label
          </CardButton>
        </XStack>
      </DemoSection>

      <DemoSection title="Text">
        <XStack gap="$3">
          <CardButton type="text" onPress={() => {}}>
            Label
          </CardButton>
          <CardButton type="text" contrast onPress={() => {}}>
            Label
          </CardButton>
        </XStack>
      </DemoSection>
    </YStack>
  )
}

export function CardButtonScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Card Button" demos={Demos} />
}

import {Divider, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="Plain">
        <Divider />
      </DemoSection>

      <DemoSection title="With label">
        <Divider label="or" />
      </DemoSection>

      <DemoSection title="With margins (marginVertical $5, marginHorizontal $5)">
        <YStack backgroundColor="$backgroundSecondary" borderRadius="$4">
          <Divider marginVertical="$5" marginHorizontal="$5" />
        </YStack>
      </DemoSection>
    </>
  )
}

export function DividerScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Divider" demos={Demos} />
}

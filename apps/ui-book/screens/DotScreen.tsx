import {Dot, XStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="Small (default)">
        <XStack gap="$4" alignItems="center">
          <Dot />
          <Dot backgroundColor="$accentYellowPrimary" />
          <Dot backgroundColor="$greenBackground" />
          <Dot backgroundColor="$redBackground" />
        </XStack>
      </DemoSection>

      <DemoSection title="Number">
        <XStack gap="$4" alignItems="center">
          <Dot count={1} />
          <Dot count={3} />
          <Dot count={9} />
        </XStack>
      </DemoSection>

      <DemoSection title="Number — custom bg">
        <XStack gap="$4" alignItems="center">
          <Dot count={2} backgroundColor="$accentYellowPrimary" />
          <Dot count={5} backgroundColor="$greenBackground" />
        </XStack>
      </DemoSection>
    </>
  )
}

export function DotScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Dot" demos={Demos} />
}

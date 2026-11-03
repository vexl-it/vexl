import {TrustBadge, XStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const ringBackgrounds = [
  '$backgroundSecondary',
  '$backgroundTertiary',
  '$accentYellowSecondary',
] as const

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="Sizes">
        <XStack gap="$4" alignItems="center">
          <TrustBadge size="small" />
          <TrustBadge size="medium" />
          <TrustBadge size="large" />
          <TrustBadge size="xlarge" />
        </XStack>
      </DemoSection>
      <DemoSection title="Ring matching the background">
        {ringBackgrounds.map((background) => (
          <XStack
            key={background}
            gap="$5"
            alignItems="center"
            backgroundColor={background}
            padding="$5"
            borderRadius="$4"
          >
            <TrustBadge size="small" ringColor={background} />
            <TrustBadge size="large" ringColor={background} />
          </XStack>
        ))}
      </DemoSection>
    </>
  )
}

export function TrustBadgeScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Trust Badge" demos={Demos} />
}

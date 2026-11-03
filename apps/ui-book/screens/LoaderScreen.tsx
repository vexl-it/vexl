import {Loader, useTheme, XStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const theme = useTheme()

  return (
    <>
      <DemoSection title="Small">
        <XStack gap="$4" alignItems="center">
          <Loader size="small" />
        </XStack>
      </DemoSection>

      <DemoSection title="Medium (default)">
        <XStack gap="$4" alignItems="center">
          <Loader size="medium" />
        </XStack>
      </DemoSection>

      <DemoSection title="Large">
        <XStack gap="$4" alignItems="center">
          <Loader size="large" />
        </XStack>
      </DemoSection>

      <DemoSection title="Custom color">
        <XStack gap="$4" alignItems="center">
          <Loader size="medium" color={theme.redForeground.get()} />
          <Loader size="medium" color={theme.greenForeground.get()} />
        </XStack>
      </DemoSection>
    </>
  )
}

export function LoaderScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Loader" demos={Demos} />
}

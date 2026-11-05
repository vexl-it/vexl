import {DotTypingIndicator, useTheme, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function DemoFrame({
  children,
}: {
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <YStack
      alignSelf="center"
      padding="$5"
      backgroundColor="$backgroundSecondary"
      borderRadius="$4"
      alignItems="center"
      justifyContent="center"
    >
      {children}
    </YStack>
  )
}

function Demos(): React.JSX.Element {
  const theme = useTheme()

  return (
    <>
      <DemoSection title="Small (chat typing)">
        <DemoFrame>
          <DotTypingIndicator />
        </DemoFrame>
      </DemoSection>
      <DemoSection title="Large accent (loading overlay)">
        <DemoFrame>
          <DotTypingIndicator
            size="large"
            color={theme.accentYellowPrimary.get()}
          />
        </DemoFrame>
      </DemoSection>
    </>
  )
}

export function DotTypingIndicatorScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Dot Typing Indicator" demos={Demos} />
}

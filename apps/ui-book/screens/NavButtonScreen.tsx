import {
  BellNotification,
  NavButton,
  type NavButtonVariant,
  XStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const variants: readonly NavButtonVariant[] = [
  'highlighted',
  'destructive',
  'normal',
  'secondary',
  'transparent',
]

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="Icon type">
        <XStack gap="$3" flexWrap="wrap">
          {pipe(
            variants,
            Array.map((variant) => (
              <NavButton
                key={variant}
                variant={variant}
                icon={BellNotification}
                onPress={() => {}}
              />
            ))
          )}
        </XStack>
      </DemoSection>
      <DemoSection title="With badge / disabled">
        <XStack gap="$3">
          <NavButton
            variant="secondary"
            icon={BellNotification}
            badge
            onPress={() => {}}
          />
          <NavButton icon={BellNotification} disabled onPress={() => {}} />
        </XStack>
      </DemoSection>
      <DemoSection title="Text type">
        <XStack gap="$3" flexWrap="wrap">
          {pipe(
            variants,
            Array.map((variant) => (
              <NavButton
                key={variant}
                variant={variant}
                type="text"
                onPress={() => {}}
              >
                Label
              </NavButton>
            ))
          )}
        </XStack>
      </DemoSection>
    </>
  )
}

export function NavButtonScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Nav Button" demos={Demos} />
}

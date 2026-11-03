import {Button, Map, PlusAdd, XStack, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function ButtonVariants({
  size,
}: {
  readonly size: 'large' | 'medium' | 'small'
}): React.JSX.Element {
  return (
    <DemoSection title={size.charAt(0).toUpperCase() + size.slice(1)}>
      <Button variant="primary" size={size} onPress={() => {}}>
        Primary
      </Button>

      <Button icon={PlusAdd} variant="primary" size={size} onPress={() => {}}>
        Primary with icon
      </Button>

      <Button variant="secondary" size={size} onPress={() => {}}>
        Secondary
      </Button>

      <Button variant="destructive" size={size} onPress={() => {}}>
        Destructive
      </Button>

      {size === 'small' ? (
        <Button variant="tertiary" size={size} onPress={() => {}}>
          Tertiary
        </Button>
      ) : null}

      <Button variant="disabled" size={size} onPress={() => {}}>
        Disabled
      </Button>

      <XStack gap="$5" alignItems="center" flexWrap="wrap">
        <Button variant="link" size={size} onPress={() => {}}>
          Link
        </Button>
        <Button variant="link" icon={Map} size={size} onPress={() => {}}>
          Link with icon
        </Button>
        <Button variant="link" size={size} disabled onPress={() => {}}>
          Disabled link
        </Button>
      </XStack>
    </DemoSection>
  )
}

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <ButtonVariants size="large" />
      <ButtonVariants size="medium" />
      <ButtonVariants size="small" />
    </YStack>
  )
}

export function ButtonScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Button" demos={Demos} />
}

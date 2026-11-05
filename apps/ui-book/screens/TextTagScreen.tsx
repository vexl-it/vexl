import {IconTag, TextTag, type TextTagVariant, XStack} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const regularVariants: readonly TextTagVariant[] = [
  'offer',
  'request',
  'neutral',
  'approved',
  'waiting',
  'new',
  'paused',
  'set',
  'accepted',
  'waitingForConfirmation',
  'outdated',
]

const statusVariants: readonly TextTagVariant[] = [
  'warning',
  'success',
  'expired',
  'failed',
]

function TagRow({
  variants,
}: {
  readonly variants: readonly TextTagVariant[]
}): React.JSX.Element {
  return (
    <XStack gap="$2" flexWrap="wrap">
      {pipe(
        variants,
        Array.map((variant) => (
          <TextTag key={variant} variant={variant} label={variant} />
        ))
      )}
    </XStack>
  )
}

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="Regular">
        <TagRow variants={regularVariants} />
      </DemoSection>
      <DemoSection title="Next to an IconTag (offer card header)">
        <XStack gap="$1" alignItems="center">
          <TextTag variant="offer" label="I have" />
          <IconTag variant="bitcoin" />
        </XStack>
      </DemoSection>
      <DemoSection title="Status (e.g. donation status)">
        <TagRow variants={statusVariants} />
      </DemoSection>
    </>
  )
}

export function TextTagScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Text Tag" demos={Demos} />
}

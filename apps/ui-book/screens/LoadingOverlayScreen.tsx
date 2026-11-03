import {
  Button,
  LoadingIndicator,
  LoadingOverlay,
  Typography,
  YStack,
} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function OverlayDemo({label}: {readonly label?: string}): React.JSX.Element {
  const [visible, setVisible] = useState(true)

  return (
    <>
      <Button
        size="small"
        variant="secondary"
        onPress={() => {
          setVisible((value) => !value)
        }}
      >
        {visible ? 'Hide overlay' : 'Show overlay'}
      </Button>
      <YStack
        position="relative"
        height={200}
        gap="$3"
        padding="$4"
        borderRadius="$4"
        overflow="hidden"
        backgroundColor="$backgroundPrimary"
      >
        <Typography variant="paragraph" color="$foregroundPrimary">
          Content under the overlay
        </Typography>
        <Typography variant="description" color="$foregroundSecondary">
          The overlay blocks touches while visible.
        </Typography>
        <LoadingOverlay visible={visible} label={label} />
      </YStack>
    </>
  )
}

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="LoadingIndicator">
        <LoadingIndicator />
        <LoadingIndicator label="Loading offers..." />
      </DemoSection>

      <DemoSection title="LoadingOverlay with label (inside a fixed-height box)">
        <OverlayDemo label="Saving..." />
      </DemoSection>

      <DemoSection title="LoadingOverlay without label">
        <OverlayDemo />
      </DemoSection>
    </>
  )
}

export function LoadingOverlayScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Loading Overlay" demos={Demos} />
}

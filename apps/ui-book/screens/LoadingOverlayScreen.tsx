import {
  Button,
  LoadingIndicator,
  LoadingOverlay,
  Typography,
  YStack,
} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [visible, setVisible] = useState(true)

  return (
    <YStack gap="$5">
      <Typography variant="description" color="$foregroundSecondary">
        LoadingIndicator
      </Typography>
      <LoadingIndicator />
      <LoadingIndicator label="Loading offers..." />

      <Typography variant="description" color="$foregroundSecondary">
        LoadingOverlay (inside a fixed-height box)
      </Typography>
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
        backgroundColor="$backgroundSecondary"
      >
        <Typography variant="paragraph" color="$foregroundPrimary">
          Content under the overlay
        </Typography>
        <Typography variant="description" color="$foregroundSecondary">
          The overlay blocks touches while visible.
        </Typography>
        <LoadingOverlay visible={visible} label="Saving..." />
      </YStack>
    </YStack>
  )
}

export function LoadingOverlayScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Loading Overlay" demos={Demos} />
}

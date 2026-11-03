import {Divider, Typography, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <Typography variant="description" color="$foregroundSecondary">
        Plain
      </Typography>
      <Divider />
      <Typography variant="description" color="$foregroundSecondary">
        With label
      </Typography>
      <Divider label="or" />
      <Typography variant="description" color="$foregroundSecondary">
        With margins (marginVertical $5, marginHorizontal $5)
      </Typography>
      <YStack backgroundColor="$backgroundSecondary" borderRadius="$4">
        <Divider marginVertical="$5" marginHorizontal="$5" />
      </YStack>
    </YStack>
  )
}

export function DividerScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Divider" demos={Demos} />
}

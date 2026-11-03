import {ReplyPreview, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <ReplyPreview
        label="Reply to"
        text="Is the offer still active?"
        padding="$4"
        borderRadius="$5"
        backgroundColor="$backgroundSecondary"
      />
      <ReplyPreview
        label="Requested with:"
        padding="$4"
        borderRadius="$5"
        backgroundColor="$accentYellowSecondary"
      />
    </YStack>
  )
}

export function ReplyPreviewScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Reply Preview" demos={Demos} />
}

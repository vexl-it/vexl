import {
  ChatContextBar,
  InfoCircle,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <ChatContextBar
        title="Their offer to sell bitcoin"
        meta={['Up to 10 000 CZK', 'Cash', 'Prague', '🇨🇿 🇬🇧']}
        actionIcon={XmarkCancelClose}
        onActionPress={() => {}}
        onPress={() => {}}
      />
      <ChatContextBar
        title="Your response to their note"
        subtitle="Looking for someone to help me set up a hardware wallet this weekend."
        actionIcon={InfoCircle}
        onActionPress={() => {}}
        onPress={() => {}}
      />
    </YStack>
  )
}

export function ChatContextBarScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Chat Context Bar" demos={Demos} />
}

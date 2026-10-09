import {Avatar, ChatBubble, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const testBannerSource = require('../assets/testBanner.png')

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <YStack alignSelf="flex-start" maxWidth="80%">
        <ChatBubble variant="incoming" text="Hi, is this offer still active?" />
      </YStack>
      <YStack alignSelf="flex-end" maxWidth="80%">
        <ChatBubble variant="outgoing" text="Yes, it is. When can we meet?" />
      </YStack>
      <YStack alignSelf="flex-start" maxWidth="80%">
        <ChatBubble
          variant="incoming"
          text="Tomorrow at 5 works for me."
          quote={{label: 'Reply to', text: 'Yes, it is. When can we meet?'}}
        />
      </YStack>
      <YStack alignSelf="flex-end" maxWidth="80%">
        <ChatBubble
          variant="outgoing"
          text="I'd like to buy 0.01 BTC."
          notice="Requested with"
        />
      </YStack>
      <YStack alignSelf="flex-end" width="80%">
        <ChatBubble
          variant="outgoing"
          text="Here is the meeting spot."
          image={<Avatar customSize={200} source={testBannerSource} />}
        />
      </YStack>
    </YStack>
  )
}

export function ChatBubbleScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Chat Bubble" demos={Demos} />
}

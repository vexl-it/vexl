import {ChatBubble, ChatTypingBubble, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <YStack maxWidth="80%">
        <ChatBubble isMine={false} text="Hi, is the offer still active?" />
      </YStack>
      <YStack maxWidth="80%" alignSelf="flex-end">
        <ChatBubble
          isMine
          text="Yes! Check https://vexl.it for details."
          reactions={['👍']}
        />
      </YStack>
      <YStack maxWidth="80%">
        <ChatBubble
          isMine={false}
          header={{label: 'Reply to', text: 'Yes! Check vexl.it for details.'}}
          text="Great, thanks."
          reactions={['❤️', '❤️']}
        />
      </YStack>
      <YStack maxWidth="80%" alignSelf="flex-end">
        <ChatBubble
          isMine
          header={{label: 'Requested with:'}}
          text="I would like to buy 0.01 BTC."
        />
      </YStack>
      <ChatTypingBubble />
    </YStack>
  )
}

export function ChatBubbleScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Chat Bubble" demos={Demos} />
}

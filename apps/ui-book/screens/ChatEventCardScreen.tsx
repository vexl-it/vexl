import {
  Avatar,
  ChatEventCard,
  IconBox,
  Rejected,
  useTheme,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {getTokens} from 'tamagui'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const theme = useTheme()

  return (
    <YStack gap="$4">
      <ChatEventCard
        image={
          <IconBox tone="red" width="$13" height="$13" borderRadius="$4">
            <Rejected
              size={getTokens().size.$8.val}
              color={theme.redForeground.get()}
            />
          </IconBox>
        }
        title="Them deleted their inbox"
      />
      <ChatEventCard
        image={<Avatar size="$11" grayscale />}
        title="You left the chat"
        description="You have chatted with this party before."
      />
      <ChatEventCard description="They declined your request." />
    </YStack>
  )
}

export function ChatEventCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Chat Event Card" demos={Demos} />
}

import {ChatComposer, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [value, setValue] = useState('')
  const [replyText, setReplyText] = useState<string | undefined>(
    'Is the offer still active?'
  )

  return (
    <YStack gap="$4">
      <ChatComposer
        value={value}
        onChangeText={setValue}
        onSend={() => {
          setValue('')
        }}
        placeholder="Type something..."
      />
      <ChatComposer
        value="Sure, see you there"
        onChangeText={() => {}}
        onSend={() => {}}
        placeholder="Type something..."
        reply={
          replyText
            ? {
                label: 'Reply to',
                text: replyText,
                onDismiss: () => {
                  setReplyText(undefined)
                },
              }
            : undefined
        }
      />
    </YStack>
  )
}

export function ChatComposerScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Chat Composer" demos={Demos} />
}

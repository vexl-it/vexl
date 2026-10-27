import {ChatInputBar} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [value, setValue] = useState('')

  return (
    <ChatInputBar
      value={value}
      onChangeText={setValue}
      onSendPress={() => {
        setValue('')
      }}
      placeholder="Type something..."
    />
  )
}

export function ChatInputBarScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Chat Input Bar" demos={Demos} />
}

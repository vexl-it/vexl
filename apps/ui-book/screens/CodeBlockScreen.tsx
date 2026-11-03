import {CodeBlock, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const sampleJson = JSON.stringify(
  {
    messageType: 'MESSAGE',
    text: 'Hello there',
    time: 1730000000000,
    repliedTo: {messageAuthor: 'them', text: 'Hi'},
  },
  null,
  2
)

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <CodeBlock>{sampleJson}</CodeBlock>
      <CodeBlock selectable={false}>{'{"short": true}'}</CodeBlock>
    </YStack>
  )
}

export function CodeBlockScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Code Block" demos={Demos} />
}

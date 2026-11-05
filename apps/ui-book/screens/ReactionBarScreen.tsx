import {ReactionBar, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const emojis = ['❤️', '👍', '👎', '😂', '😮', '😢']

function Demos(): React.JSX.Element {
  const [selected, setSelected] = useState<string | undefined>('👍')

  return (
    <YStack alignItems="flex-start">
      <ReactionBar
        emojis={emojis}
        selected={selected}
        onSelect={(emoji) => {
          setSelected((previous) => (previous === emoji ? undefined : emoji))
        }}
      />
    </YStack>
  )
}

export function ReactionBarScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Reaction Bar" demos={Demos} />
}

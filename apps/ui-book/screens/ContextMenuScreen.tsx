import {
  ContextMenu,
  ContextMenuItem,
  Copy,
  Reply,
  TrashBin,
  YStack,
} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack alignItems="flex-start">
      <ContextMenu>
        <ContextMenuItem icon={Reply} label="Reply" onPress={() => {}} />
        <ContextMenuItem icon={Copy} label="Copy" onPress={() => {}} />
        <ContextMenuItem icon={TrashBin} label="Delete" onPress={() => {}} />
      </ContextMenu>
    </YStack>
  )
}

export function ContextMenuScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Context Menu" demos={Demos} />
}

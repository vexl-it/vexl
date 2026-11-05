import {
  Camera,
  Copy,
  ImagePhoto,
  PopoverMenu,
  PopoverMenuItem,
  Reply,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {Alert} from 'react-native'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function handlePress(label: string): void {
  Alert.alert('Pressed', label)
}

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <PopoverMenu>
        <PopoverMenuItem
          icon={Camera}
          label="Camera"
          onPress={() => {
            handlePress('Camera')
          }}
        />
        <PopoverMenuItem
          icon={ImagePhoto}
          label="Gallery"
          onPress={() => {
            handlePress('Gallery')
          }}
        />
      </PopoverMenu>
      <PopoverMenu>
        <PopoverMenuItem
          icon={Reply}
          label="Reply"
          onPress={() => {
            handlePress('Reply')
          }}
        />
        <PopoverMenuItem
          icon={Copy}
          label="Copy"
          onPress={() => {
            handlePress('Copy')
          }}
        />
      </PopoverMenu>
    </YStack>
  )
}

export function PopoverMenuScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Popover Menu" demos={Demos} />
}

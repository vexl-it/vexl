import {PhotoPickerPlaceholder, Typography, YStack} from '@vexl-next/ui'
import React from 'react'
import {Alert} from 'react-native'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4" alignItems="center">
      <PhotoPickerPlaceholder
        size={256}
        onPress={() => {
          Alert.alert('Pick a photo')
        }}
      />
      <Typography variant="descriptionBold" color="$foregroundSecondary">
        size 160
      </Typography>
      <PhotoPickerPlaceholder size={160} onPress={() => {}} />
    </YStack>
  )
}

export function PhotoPickerPlaceholderScreen(): React.JSX.Element {
  return (
    <ComponentScreenLayout title="Photo Picker Placeholder" demos={Demos} />
  )
}

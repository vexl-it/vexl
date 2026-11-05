import {TwoToneCard, Typography, YStack} from '@vexl-next/ui'
import React from 'react'
import {Alert} from 'react-native'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <TwoToneCard>
        <TwoToneCard.Header>
          <Typography variant="descriptionBold" color="$foregroundPrimary">
            Header
          </Typography>
        </TwoToneCard.Header>
        <TwoToneCard.Content>
          <Typography variant="description" color="$foregroundSecondary">
            Static card content
          </Typography>
        </TwoToneCard.Content>
      </TwoToneCard>

      <TwoToneCard
        onPress={() => {
          Alert.alert('Card pressed')
        }}
      >
        <TwoToneCard.Header gap="$2">
          <Typography variant="descriptionBold" color="$foregroundPrimary">
            Pressable card
          </Typography>
          <Typography variant="micro" color="$foregroundSecondary">
            Fades on press
          </Typography>
        </TwoToneCard.Header>
        <TwoToneCard.Content>
          <Typography variant="tabSmall" color="$foregroundPrimary">
            1 000 EUR
          </Typography>
        </TwoToneCard.Content>
      </TwoToneCard>
    </YStack>
  )
}

export function TwoToneCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Two Tone Card" demos={Demos} />
}

import {Avatar, ClubCard, TextTag, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const clubTestAvatar = require('../assets/clubTestAvatar.png') as number

const avatar = <Avatar size="medium" source={clubTestAvatar} />

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$3">
      <ClubCard
        avatar={avatar}
        name="btc prague 2025"
        subtitle="10 common friends"
      />
      <ClubCard
        avatar={avatar}
        name="btc prague 2025"
        subtitle="10 common friends"
        tag={<TextTag variant="outdated" label="Expired" />}
      />
      <ClubCard
        avatar={avatar}
        name="btc prague 2025"
        subtitle="10 common friends"
        onPress={() => {}}
      />
    </YStack>
  )
}

export function ClubCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Club Card" demos={Demos} />
}

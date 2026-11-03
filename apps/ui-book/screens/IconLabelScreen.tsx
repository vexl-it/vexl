import {
  ArrowsHorizontal,
  IconLabel,
  PeopleUsers,
  SandWatch,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <XStack gap="$2" rowGap="$1" flexWrap="wrap">
        <IconLabel flexShrink={0} icon={PeopleUsers} label="128 members" />
        <IconLabel flexShrink={0} icon={ArrowsHorizontal} label="12 offers" />
        <IconLabel flexShrink={0} icon={SandWatch} label="Expires 1. 1. 2027" />
      </XStack>
      <XStack width={160}>
        <IconLabel
          icon={PeopleUsers}
          label="A long label that truncates when space runs out"
        />
      </XStack>
    </YStack>
  )
}

export function IconLabelScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Icon Label" demos={Demos} />
}

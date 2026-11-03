import {BellNotification, SectionHeader, Switch, YStack} from '@vexl-next/ui'
import {atom} from 'jotai'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const notificationsAtom = atom(true)

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$6">
      <SectionHeader title="Title only" />
      <SectionHeader
        title="With description"
        description="Short explanation of what this section contains."
      />
      <SectionHeader
        icon={BellNotification}
        title="With icon"
        description="Icon is rendered before the title."
      />
      <SectionHeader
        title="With trailing Switch"
        description="Any node can be passed as trailing."
        trailing={<Switch valueAtom={notificationsAtom} />}
      />
      <SectionHeader
        title="With onPress"
        description="Shows a chevron and becomes pressable."
        onPress={() => {}}
      />
    </YStack>
  )
}

export function SectionHeaderScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Section Header" demos={Demos} />
}

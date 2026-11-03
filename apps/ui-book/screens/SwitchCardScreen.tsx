import {SwitchCard, YStack} from '@vexl-next/ui'
import {atom} from 'jotai'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const titleOnlyAtom = atom(false)
const withDescriptionAtom = atom(true)
const tertiaryAtom = atom(true)
const plainAtom = atom(false)

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$3">
      <SwitchCard title="Title only" valueAtom={titleOnlyAtom} />
      <SwitchCard
        title="With description"
        description="Notify me when someone reaches out to my offer."
        valueAtom={withDescriptionAtom}
      />
      <SwitchCard
        title="backgroundTertiary"
        description="Custom background color."
        valueAtom={tertiaryAtom}
        backgroundColor="$backgroundTertiary"
      />
      <SwitchCard plain title="Plain (no background)" valueAtom={plainAtom} />
    </YStack>
  )
}

export function SwitchCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Switch Card" demos={Demos} />
}

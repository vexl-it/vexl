import {Disclosure, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const bodyText =
  'Your offer is shared only with people in your contact list and their contacts. Nobody else can see it, and we never see it either.'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$3">
      <Disclosure title="How sharing works">{bodyText}</Disclosure>
      <Disclosure title="How sharing works (default open)" defaultOpen>
        {bodyText}
      </Disclosure>
    </YStack>
  )
}

export function DisclosureScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Disclosure" demos={Demos} />
}

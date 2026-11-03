import {CountBadge, XStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <XStack gap="$3" alignItems="center">
      <CountBadge count={1} />
      <CountBadge count={9} />
      <CountBadge count={42} />
      <CountBadge count={128} />
    </XStack>
  )
}

export function CountBadgeScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Count Badge" demos={Demos} />
}

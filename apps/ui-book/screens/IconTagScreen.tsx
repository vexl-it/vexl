import {IconTag, XStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <XStack gap="$3" flexWrap="wrap">
      <IconTag variant="bitcoin" />
      <IconTag variant="product" />
      <IconTag variant="service" />
    </XStack>
  )
}

export function IconTagScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Icon Tag" demos={Demos} />
}

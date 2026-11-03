import {FilterTag, TagLabel, XStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <>
      <DemoSection title="Default">
        <XStack gap="$3" flexWrap="wrap">
          <FilterTag label="Label" />
          <FilterTag label="Selected" selected />
        </XStack>
      </DemoSection>

      <DemoSection title="With icon">
        <XStack gap="$3" flexWrap="wrap">
          <FilterTag label="Label" icon={TagLabel} />
          <FilterTag label="Selected" icon={TagLabel} selected />
        </XStack>
      </DemoSection>
    </>
  )
}

export function FilterTagScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Filter Tag" demos={Demos} />
}

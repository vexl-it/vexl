import {Collapse, ExpandToggle, InfoBox, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)

  return (
    <YStack>
      <ExpandToggle
        label={expanded ? 'Hide options' : 'Show more options'}
        expanded={expanded}
        count={2}
        onToggle={() => {
          setExpanded((value) => !value)
        }}
      />
      <Collapse expanded={expanded}>
        <InfoBox>Extra options live here.</InfoBox>
      </Collapse>
      <ExpandToggle
        label="Without a count"
        expanded={false}
        onToggle={() => {}}
      />
    </YStack>
  )
}

export function ExpandToggleScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Expand Toggle" demos={Demos} />
}

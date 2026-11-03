import {Button, Collapse, InfoBox, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)

  return (
    <YStack gap="$3">
      <Button
        size="small"
        variant="secondary"
        onPress={() => {
          setExpanded((value) => !value)
        }}
      >
        {expanded ? 'Collapse' : 'Expand'}
      </Button>
      <Collapse expanded={expanded}>
        <InfoBox>
          Collapsed content measures its own height and animates open and
          closed.
        </InfoBox>
      </Collapse>
    </YStack>
  )
}

export function CollapseScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Collapse" demos={Demos} />
}

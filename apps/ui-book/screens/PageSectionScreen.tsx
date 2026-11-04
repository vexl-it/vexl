import {PageSection, Typography} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <DemoSection title="Centered section (max 1200px, more padding on wide screens)">
      <PageSection backgroundColor="$backgroundSecondary" borderRadius="$5">
        <Typography variant="heading2" color="$foregroundPrimary">
          Section title
        </Typography>
        <Typography variant="paragraph" color="$foregroundSecondary">
          Children stack with a $7 gap.
        </Typography>
      </PageSection>
    </DemoSection>
  )
}

export function PageSectionScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Page Section" demos={Demos} />
}

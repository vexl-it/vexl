import {
  Calendar,
  ChecklistCell,
  ChecklistSection,
  MathCalculate,
  PinGeolocation,
} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <ChecklistSection title="Meeting detail">
      <ChecklistCell
        icon={Calendar}
        headline="Date and time"
        subtitle="Mon, 6 Oct 2026 at 14:30"
        state="completed"
      />
      <ChecklistCell
        icon={PinGeolocation}
        headline="Meeting location"
        state="pending"
        onPress={() => {}}
      />
      <ChecklistCell
        icon={MathCalculate}
        headline="Calculate amount"
        state="initial"
        onPress={() => {}}
      />
    </ChecklistSection>
  )
}

export function ChecklistSectionScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Checklist Section" demos={Demos} />
}

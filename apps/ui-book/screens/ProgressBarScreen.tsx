import {Button, ProgressBar} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [percentage, setPercentage] = useState(30)

  return (
    <>
      <DemoSection title={`Determinate (${percentage} %)`}>
        <ProgressBar percentage={percentage} />
        <Button
          size="small"
          variant="secondary"
          onPress={() => {
            setPercentage((current) => (current >= 100 ? 0 : current + 10))
          }}
        >
          +10 %
        </Button>
      </DemoSection>
      <DemoSection title="Indeterminate">
        <ProgressBar />
      </DemoSection>
    </>
  )
}

export function ProgressBarScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Progress Bar" demos={Demos} />
}

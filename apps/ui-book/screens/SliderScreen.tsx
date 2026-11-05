import {Slider, Typography} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [radius, setRadius] = useState(5)
  const [percentage, setPercentage] = useState(0)
  const [amount, setAmount] = useState(100)

  return (
    <>
      <DemoSection title="Filled, step 5">
        <Slider
          min={0}
          max={50}
          step={5}
          value={radius}
          onValueChange={setRadius}
          filled
        />
        <Typography variant="micro" color="$foregroundSecondary">
          Radius: {radius} km
        </Typography>
      </DemoSection>
      <DemoSection title="Linear, unfilled">
        <Slider
          min={-20}
          max={20}
          value={percentage}
          onValueChange={setPercentage}
        />
        <Typography variant="micro" color="$foregroundSecondary">
          {percentage} %
        </Typography>
      </DemoSection>
      <DemoSection title="Log scale">
        <Slider
          min={0}
          max={100000}
          scale="log"
          value={amount}
          onValueChange={setAmount}
          filled
        />
        <Typography variant="micro" color="$foregroundSecondary">
          {amount}
        </Typography>
      </DemoSection>
    </>
  )
}

export function SliderScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Slider" demos={Demos} />
}

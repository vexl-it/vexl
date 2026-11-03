import {Slider, Typography, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [radius, setRadius] = useState(5)
  const [percentage, setPercentage] = useState(0)
  const [amount, setAmount] = useState(100)

  return (
    <YStack gap="$4">
      <Typography variant="descriptionBold" color="$foregroundSecondary">
        Filled, step 5
      </Typography>
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

      <Typography variant="descriptionBold" color="$foregroundSecondary">
        Linear, unfilled
      </Typography>
      <Slider
        min={-20}
        max={20}
        value={percentage}
        onValueChange={setPercentage}
      />
      <Typography variant="micro" color="$foregroundSecondary">
        {percentage} %
      </Typography>

      <Typography variant="descriptionBold" color="$foregroundSecondary">
        Log scale
      </Typography>
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
    </YStack>
  )
}

export function SliderScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Slider" demos={Demos} />
}

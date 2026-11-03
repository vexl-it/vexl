import {Button, ProgressBar, Typography, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [percentage, setPercentage] = useState(30)

  return (
    <YStack gap="$4">
      <Typography variant="descriptionBold" color="$foregroundSecondary">
        Determinate ({percentage} %)
      </Typography>
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
      <Typography variant="descriptionBold" color="$foregroundSecondary">
        Indeterminate
      </Typography>
      <ProgressBar />
    </YStack>
  )
}

export function ProgressBarScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Progress Bar" demos={Demos} />
}

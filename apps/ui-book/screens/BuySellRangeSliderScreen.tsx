import {BuySellRangeSlider, Typography, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function getInfoText(percentage: number): string {
  if (percentage <= 0) {
    return "You'll sell faster, but you'll earn a bit less than the market price."
  }
  if (percentage <= 5) {
    return "You'll earn a bit more, but it may take slightly longer to find a buyer."
  }
  return "You'll earn significantly more, but finding a buyer may take longer."
}

function Demos(): React.JSX.Element {
  const [percentage, setPercentage] = useState(0)
  const amount = 1000
  const low = Math.round(amount * (1 + (percentage - 2) / 100))
  const high = Math.round(amount * (1 + (percentage + 2) / 100))

  return (
    <YStack gap="$4">
      <BuySellRangeSlider
        title="You sell BTC for"
        valueLabel={
          percentage === 0
            ? 'Market price'
            : `${percentage > 0 ? '+' : ''}${percentage} %`
        }
        leftLabel="Sell faster"
        rightLabel="Earn more"
        minPercentage={-10}
        maxPercentage={10}
        percentage={percentage}
        onPercentageChange={setPercentage}
        amountText={`You'll get around ${low} – ${high} EUR`}
        infoText={getInfoText(percentage)}
      />
      <Typography variant="micro" color="$foregroundSecondary">
        Current percentage: {percentage}%
      </Typography>
    </YStack>
  )
}

export function BuySellRangeSliderScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Buy/Sell Range Slider" demos={Demos} />
}

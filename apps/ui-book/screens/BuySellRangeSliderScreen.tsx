import {
  BuySellRangeSlider,
  SizableText,
  Theme,
  Typography,
  YStack,
} from '@vexl-next/ui'
import React, {useState} from 'react'
import {ScrollView} from 'react-native'

function getInfoText(percentage: number): string {
  if (percentage <= 0) {
    return "You'll sell faster, but you'll earn a bit less than the market price."
  }
  if (percentage <= 5) {
    return "You'll earn a bit more, but it may take slightly longer to find a buyer."
  }
  return "You'll earn significantly more, but finding a buyer may take longer."
}

function InteractiveSlider({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  const [percentage, setPercentage] = useState(0)
  const amount = 1000
  const low = Math.round(amount * (1 + (percentage - 2) / 100))
  const high = Math.round(amount * (1 + (percentage + 2) / 100))

  return (
    <Theme name={theme}>
      <YStack
        gap="$4"
        padding="$5"
        backgroundColor="$backgroundPrimary"
        borderRadius="$4"
      >
        <SizableText
          fontFamily="$body"
          fontWeight="600"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </SizableText>

        <BuySellRangeSlider
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
    </Theme>
  )
}

export function BuySellRangeSliderScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Buy/Sell Range Slider
        </SizableText>

        <InteractiveSlider theme="light" />
        <InteractiveSlider theme="dark" />
      </YStack>
    </ScrollView>
  )
}

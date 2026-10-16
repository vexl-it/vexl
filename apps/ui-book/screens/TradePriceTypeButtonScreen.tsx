import {
  AnimatedLiveIndicator,
  TradePriceTypeButton,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$4">
      <XStack ai="center" gap="$2">
        <AnimatedLiveIndicator color="$accentYellowPrimary" />
        <AnimatedLiveIndicator color="$foregroundSecondary" />
      </XStack>
      <TradePriceTypeButton
        priceType="live"
        label="Live market price"
        onPress={() => {}}
      />
      <TradePriceTypeButton
        priceType="frozen"
        label="Frozen price"
        onPress={() => {}}
      />
      <TradePriceTypeButton
        priceType="your"
        label="Your price"
        onPress={() => {}}
      />
    </YStack>
  )
}

export function TradePriceTypeButtonScreen(): React.JSX.Element {
  return (
    <ComponentScreenLayout
      title="Trade Price Type Button & Live Indicator"
      demos={Demos}
    />
  )
}

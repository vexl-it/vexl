import {
  BtcPriceLabel,
  InfoCircle,
  TradePriceTypeButton,
  useTheme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const theme = useTheme()

  return (
    <YStack gap="$5">
      <BtcPriceLabel
        priceLabel="1 BTC = 2 345 678 CZK"
        lastUpdatedLabel="Last updated: 6. 10. 2026 14:30"
        onPress={() => {}}
      />
      <BtcPriceLabel priceLabel="1 BTC = -" loading />
      <XStack ai="flex-start" jc="space-between" gap="$4">
        <TradePriceTypeButton
          priceType="live"
          label="Live market price"
          onPress={() => {}}
        />
        <BtcPriceLabel
          priceLabel="1 BTC = 2 345 678 CZK"
          col="$foregroundSecondary"
          fos={12}
          textAlign="right"
          onPress={() => {}}
          trailingElement={
            <InfoCircle color={theme.foregroundSecondary.get()} size={16} />
          }
        />
      </XStack>
    </YStack>
  )
}

export function BtcPriceLabelScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="BTC Price Label" demos={Demos} />
}

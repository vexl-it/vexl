import {PriceStatusRow, YStack} from '@vexl-next/ui'
import React from 'react'
import {Alert} from 'react-native'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$3">
      <PriceStatusRow
        headline="1 BTC = 2 135 000 Kč"
        trailingText="Updated 3. 11. 2026 14:05"
      />
      <PriceStatusRow headline="1 BTC = 2 135 000 Kč" loading />
      <PriceStatusRow headline="1 BTC =" loading />
      <PriceStatusRow
        headline="Exchange rate unavailable"
        retryLabel="Try again"
        onRetry={() => {
          Alert.alert('Retry pressed')
        }}
      />
    </YStack>
  )
}

export function PriceStatusRowScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Price Status Row" demos={Demos} />
}

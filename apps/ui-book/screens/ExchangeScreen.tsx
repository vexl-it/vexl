import {Exchange, SizableText, YStack, type BtcUnit} from '@vexl-next/ui'
import React, {useCallback, useState} from 'react'
import {Alert, ScrollView} from 'react-native'

export function ExchangeScreen(): React.JSX.Element {
  const [btcValue, setBtcValue] = useState('')
  const [btcUnit, setBtcUnit] = useState<BtcUnit>('SATS')
  const [fiatValue, setFiatValue] = useState('')

  const [fixedFiatValue, setFixedFiatValue] = useState('')

  const handleFiatCurrencyPress = useCallback(() => {
    Alert.alert('Currency Picker', 'Open currency picker here')
  }, [])

  return (
    <ScrollView>
      <YStack
        flex={1}
        padding="$5"
        gap="$7"
        backgroundColor="$backgroundPrimary"
      >
        <SizableText fontWeight="600" fontSize="$5">
          Exchange
        </SizableText>

        <SizableText
          fontWeight="500"
          fontSize="$2"
          color="$foregroundSecondary"
        >
          Both inputs editable (cs-CZ locale)
        </SizableText>
        <Exchange
          btcValue={btcValue}
          btcUnit={btcUnit}
          onBtcValueChange={setBtcValue}
          onBtcUnitChange={setBtcUnit}
          fiatValue={fiatValue}
          fiatCurrency="CZK"
          onFiatValueChange={setFiatValue}
          onFiatCurrencyPress={handleFiatCurrencyPress}
          locale="cs-CZ"
        />

        <SizableText
          fontWeight="500"
          fontSize="$2"
          color="$foregroundSecondary"
        >
          BTC read-only — fixed &quot;1 BTC&quot; (en-US locale)
        </SizableText>
        <Exchange
          btcValue="1"
          btcUnit="BTC"
          onBtcUnitChange={() => {}}
          btcEditable={false}
          fiatValue={fixedFiatValue}
          fiatCurrency="USD"
          onFiatValueChange={setFixedFiatValue}
          onFiatCurrencyPress={handleFiatCurrencyPress}
          locale="en-US"
        />
      </YStack>
    </ScrollView>
  )
}

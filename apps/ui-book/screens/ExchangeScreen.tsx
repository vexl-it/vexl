import {Exchange, type BtcUnit} from '@vexl-next/ui'
import React, {useCallback, useState} from 'react'
import {Alert} from 'react-native'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [btcValue, setBtcValue] = useState('')
  const [btcUnit, setBtcUnit] = useState<BtcUnit>('SATS')
  const [fiatValue, setFiatValue] = useState('')

  const [fixedFiatValue, setFixedFiatValue] = useState('')

  const handleFiatCurrencyPress = useCallback(() => {
    Alert.alert('Currency Picker', 'Open currency picker here')
  }, [])

  return (
    <>
      <DemoSection title="Both inputs editable (cs-CZ locale)">
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
      </DemoSection>

      <DemoSection title='BTC read-only — fixed "1 BTC" (en-US locale)'>
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
      </DemoSection>
    </>
  )
}

export function ExchangeScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Exchange" demos={Demos} />
}

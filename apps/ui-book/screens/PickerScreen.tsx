import {
  CurrencyBitcoinCircle,
  EuroCurrency,
  MoneyBankNotes,
  Picker,
} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const currencyItems = [
  {label: 'Bitcoin', value: 'btc', icon: CurrencyBitcoinCircle},
  {label: 'Euro', value: 'eur', icon: EuroCurrency},
  {label: 'Cash', value: 'cash', icon: MoneyBankNotes},
] as const

const plainItems = [
  {label: 'Option A', value: 'a'},
  {label: 'Option B', value: 'b'},
  {label: 'Option C', value: 'c'},
  {label: 'Option D', value: 'd'},
] as const

function Demos(): React.JSX.Element {
  const [currency, setCurrency] = useState<string>('btc')
  const [plain, setPlain] = useState<string>('a')

  return (
    <>
      <DemoSection title="With icons">
        <Picker
          items={currencyItems}
          value={currency}
          onValueChange={setCurrency}
          placeholder="Choose currency"
        />
      </DemoSection>

      <DemoSection title="Without icons">
        <Picker
          items={plainItems}
          value={plain}
          onValueChange={setPlain}
          placeholder="Choose option"
        />
      </DemoSection>
    </>
  )
}

export function PickerScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Picker" demos={Demos} />
}

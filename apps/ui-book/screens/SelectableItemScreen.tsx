import {SelectableItem, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

const currencies = [
  {label: '🇺🇸 United States Dollar', note: 'USD / $', value: 'usd'},
  {label: '🇪🇺 Euro', note: 'EUR / €', value: 'eur'},
  {label: '🇬🇧 British Pound', note: 'GBP / £', value: 'gbp'},
  {label: '🇨🇿 Czech Koruna', note: 'CZK / Kč', value: 'czk'},
  {label: '🇨🇭 Swiss Franc', note: 'CHF / Fr.', value: 'chf'},
]

const languages = [
  {label: '🇬🇧 English', value: 'en'},
  {label: '🇨🇿 Čeština', value: 'cs'},
  {label: '🇩🇪 Deutsch', value: 'de'},
  {label: '🇪🇸 Español', value: 'es'},
]

function Demos(): React.JSX.Element {
  const [selectedCurrency, setSelectedCurrency] = useState('usd')
  const [selectedLanguage, setSelectedLanguage] = useState('en')

  return (
    <>
      <DemoSection title="With notes">
        <YStack>
          {currencies.map((currency) => (
            <SelectableItem
              key={currency.value}
              label={currency.label}
              note={currency.note}
              selected={selectedCurrency === currency.value}
              onPress={() => {
                setSelectedCurrency(currency.value)
              }}
            />
          ))}
        </YStack>
      </DemoSection>
      <DemoSection title="Without notes">
        <YStack>
          {languages.map((language) => (
            <SelectableItem
              key={language.value}
              label={language.label}
              selected={selectedLanguage === language.value}
              onPress={() => {
                setSelectedLanguage(language.value)
              }}
            />
          ))}
        </YStack>
      </DemoSection>
    </>
  )
}

export function SelectableItemScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Selectable Item" demos={Demos} />
}

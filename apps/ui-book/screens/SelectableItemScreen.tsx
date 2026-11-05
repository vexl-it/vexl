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

const countries = [
  {flag: '🇨🇿', dialCode: '+420', name: 'Czechia', value: 'cz'},
  {flag: '🇸🇰', dialCode: '+421', name: 'Slovakia', value: 'sk'},
  {flag: '🇩🇪', dialCode: '+49', name: 'Germany', value: 'de'},
  {flag: '🇦🇶', dialCode: '', name: 'Antarctica', value: 'aq'},
]

function Demos(): React.JSX.Element {
  const [selectedCurrency, setSelectedCurrency] = useState('usd')
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [selectedCountry, setSelectedCountry] = useState('cz')

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
      <DemoSection title="With emoji and prefix">
        <YStack>
          {countries.map((country) => (
            <SelectableItem
              key={country.value}
              emoji={country.flag}
              prefix={country.dialCode}
              label={country.name}
              selected={selectedCountry === country.value}
              onPress={() => {
                setSelectedCountry(country.value)
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

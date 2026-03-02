import {SelectableItem, SizableText, Theme, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'
import {ScrollView} from 'react-native'

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

function SectionLabel({
  children,
}: {
  readonly children: string
}): React.JSX.Element {
  return (
    <SizableText
      fontFamily="$body"
      fontWeight="600"
      fontSize="$2"
      color="$foregroundSecondary"
      paddingTop="$3"
    >
      {children}
    </SizableText>
  )
}

function InteractiveGroup({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  const [selectedCurrency, setSelectedCurrency] = useState('usd')
  const [selectedLanguage, setSelectedLanguage] = useState('en')

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

        <SectionLabel>With notes</SectionLabel>
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

        <SectionLabel>Without notes</SectionLabel>
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
      </YStack>
    </Theme>
  )
}

export function SelectableItemScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Selectable Item
        </SizableText>

        <InteractiveGroup theme="light" />
        <InteractiveGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}

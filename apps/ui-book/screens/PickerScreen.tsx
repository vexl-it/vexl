import {
  CurrencyBitcoinCircle,
  EuroCurrency,
  MoneyBankNotes,
  Picker,
  SizableText,
  Theme,
  YStack,
} from '@vexl-next/ui'
import React, {useCallback, useState} from 'react'
import {ScrollView} from 'react-native'

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

function ThemeGroup({
  theme,
}: {
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  const [currency, setCurrency] = useState<string>('btc')
  const [plain, setPlain] = useState<string>('a')

  const handleCurrencyChange = useCallback((val: string) => {
    setCurrency(val)
  }, [])

  const handlePlainChange = useCallback((val: string) => {
    setPlain(val)
  }, [])

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

        <SizableText
          fontWeight="500"
          fontSize="$2"
          color="$foregroundSecondary"
        >
          With icons
        </SizableText>
        <Picker
          items={currencyItems}
          value={currency}
          onValueChange={handleCurrencyChange}
          placeholder="Choose currency"
        />

        <SizableText
          fontWeight="500"
          fontSize="$2"
          color="$foregroundSecondary"
        >
          Without icons
        </SizableText>
        <Picker
          items={plainItems}
          value={plain}
          onValueChange={handlePlainChange}
          placeholder="Choose option"
        />
      </YStack>
    </Theme>
  )
}

export function PickerScreen(): React.JSX.Element {
  return (
    <ScrollView style={{flex: 1}}>
      <YStack padding="$5" gap="$4">
        <SizableText
          fontFamily="$heading"
          fontWeight="700"
          fontSize="$3"
          color="$foregroundPrimary"
        >
          Picker
        </SizableText>

        <ThemeGroup theme="light" />
        <ThemeGroup theme="dark" />
      </YStack>
    </ScrollView>
  )
}

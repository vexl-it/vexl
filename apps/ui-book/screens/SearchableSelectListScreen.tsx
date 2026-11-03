import {SearchableSelectList, Theme, Typography, YStack} from '@vexl-next/ui'
import {Array, pipe, String} from 'effect'
import {atom, useAtomValue, type PrimitiveAtom} from 'jotai'
import React, {useState} from 'react'

interface Currency {
  readonly code: string
  readonly name: string
}

const currencies: readonly Currency[] = [
  {code: 'CZK', name: '🇨🇿 Czech koruna'},
  {code: 'EUR', name: '🇪🇺 Euro'},
  {code: 'GBP', name: '🇬🇧 British pound'},
  {code: 'USD', name: '🇺🇸 US dollar'},
  {code: 'CHF', name: '🇨🇭 Swiss franc'},
]

const lightSearchAtom = atom('')
const darkSearchAtom = atom('')

function currencyCode(currency: Currency): string {
  return currency.code
}

function currencyName(currency: Currency): string {
  return currency.name
}

function ThemeSection({
  themeName,
  searchAtom,
}: {
  readonly themeName: 'light' | 'dark'
  readonly searchAtom: PrimitiveAtom<string>
}): React.JSX.Element {
  const search = useAtomValue(searchAtom)
  const [selectedCode, setSelectedCode] = useState('EUR')
  const items = pipe(
    currencies,
    Array.filter((currency) =>
      pipe(
        currency.name,
        String.toLowerCase,
        String.includes(String.toLowerCase(search))
      )
    )
  )

  return (
    <Theme name={themeName}>
      <YStack flex={1} padding="$5" backgroundColor="$backgroundPrimary">
        <Typography variant="titlesSmall" color="$foregroundPrimary">
          {themeName === 'light' ? 'Light' : 'Dark'}
        </Typography>
        <SearchableSelectList
          items={items}
          keyExtractor={currencyCode}
          getLabel={currencyName}
          getNote={currencyCode}
          selectedKey={selectedCode}
          onSelect={(currency) => {
            setSelectedCode(currency.code)
          }}
          searchValueAtom={searchAtom}
          searchPlaceholder="Search"
          emptyTitle="Nothing found"
          emptyDescription="Try searching by currency name"
        />
      </YStack>
    </Theme>
  )
}

export function SearchableSelectListScreen(): React.JSX.Element {
  return (
    <YStack flex={1}>
      <ThemeSection themeName="light" searchAtom={lightSearchAtom} />
      <ThemeSection themeName="dark" searchAtom={darkSearchAtom} />
    </YStack>
  )
}

import {SearchableSelectList} from '@vexl-next/ui'
import {Array, pipe, String} from 'effect'
import {atom, useAtomValue} from 'jotai'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

interface Currency {
  readonly code: string
  readonly flag: string
  readonly name: string
}

const currencies: readonly Currency[] = [
  {code: 'CZK', flag: '🇨🇿', name: 'Czech koruna'},
  {code: 'EUR', flag: '🇪🇺', name: 'Euro'},
  {code: 'GBP', flag: '🇬🇧', name: 'British pound'},
  {code: 'USD', flag: '🇺🇸', name: 'US dollar'},
  {code: 'CHF', flag: '🇨🇭', name: 'Swiss franc'},
]

function currencyCode(currency: Currency): string {
  return currency.code
}

function currencyFlag(currency: Currency): string {
  return currency.flag
}

function currencyName(currency: Currency): string {
  return currency.name
}

function Demos(): React.JSX.Element {
  const [searchAtom] = useState(() => atom(''))
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
    <SearchableSelectList
      items={items}
      keyExtractor={currencyCode}
      getLabel={currencyName}
      getEmoji={currencyFlag}
      getPrefix={currencyCode}
      selectedKey={selectedCode}
      onSelect={(currency) => {
        setSelectedCode(currency.code)
      }}
      searchValueAtom={searchAtom}
      searchPlaceholder="Search"
      emptyTitle="Nothing found"
      emptyDescription="Try searching by currency name"
    />
  )
}

export function SearchableSelectListScreen(): React.JSX.Element {
  return (
    <ComponentScreenLayout title="Searchable Select List" demos={Demos} fill />
  )
}

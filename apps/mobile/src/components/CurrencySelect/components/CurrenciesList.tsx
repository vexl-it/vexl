import {FlashList} from '@shopify/flash-list'
import {
  type CurrencyCode,
  type CurrencyInfo,
} from '@vexl-next/domain/src/general/currency.brand'
import {type Atom} from 'jotai'
import React, {useCallback} from 'react'
import {Stack} from 'tamagui'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import CurrencySelectListItem from './CurrencySelectListItem'

interface Props {
  currencies: Array<Atom<CurrencyInfo>>
  selectedCurrencyCodeAtom: Atom<CurrencyCode | undefined>
  onItemPress: (currency: CurrencyCode) => void
}

function ItemSeparatorComponent(): JSX.Element {
  return <Stack h={2} bc="$greyAccent1" />
}

function CurrenciesList({
  currencies,
  selectedCurrencyCodeAtom,
  onItemPress,
}: Props): JSX.Element {
  const renderItem = useCallback(
    ({item: currencyAtom}: {item: Atom<CurrencyInfo>}): JSX.Element => (
      <CurrencySelectListItem
        currencyAtom={currencyAtom}
        selectedCurrencyCodeAtom={selectedCurrencyCodeAtom}
        onItemPress={onItemPress}
      />
    ),
    [onItemPress, selectedCurrencyCodeAtom]
  )
  return (
    <FlashList
      estimatedItemSize={63}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      data={currencies}
      ItemSeparatorComponent={ItemSeparatorComponent}
      renderItem={renderItem}
      keyExtractor={atomKeyExtractor}
    />
  )
}

export default CurrenciesList

import {
  type CurrencyCode,
  type CurrencyInfo,
} from '@vexl-next/domain/src/general/currency.brand'
import {type Atom, type WritableAtom} from 'jotai'
import React, {useCallback} from 'react'
import {FlatList} from 'react-native'
import {Stack} from 'tamagui'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import CurrencySelectListItem from './CurrencySelectListItem'

interface Props {
  currencies: Array<Atom<CurrencyInfo>>
  selectedCurrencyCodeAtom: Atom<CurrencyCode | undefined>
  onItemPress: () => void
  updateCurrencyLimitsAtom: WritableAtom<
    null,
    [
      {
        currency: CurrencyCode
      },
    ],
    boolean
  >
}

function ItemSeparatorComponent(): JSX.Element {
  return <Stack h={2} bc="$greyAccent1" />
}

function CurrenciesList({
  currencies,
  selectedCurrencyCodeAtom,
  onItemPress,
  updateCurrencyLimitsAtom,
}: Props): JSX.Element {
  const renderItem = useCallback(
    ({item: currencyAtom}: {item: Atom<CurrencyInfo>}): JSX.Element => (
      <CurrencySelectListItem
        currencyAtom={currencyAtom}
        selectedCurrencyCodeAtom={selectedCurrencyCodeAtom}
        onItemPress={onItemPress}
        updateCurrencyLimitsAtom={updateCurrencyLimitsAtom}
      />
    ),
    [onItemPress, selectedCurrencyCodeAtom, updateCurrencyLimitsAtom]
  )
  return (
    <FlatList
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

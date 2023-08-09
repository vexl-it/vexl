import React from 'react'
import {Stack} from 'tamagui'
import {
  type CurrencyCode,
  type CurrencyInfo,
} from '@vexl-next/domain/dist/general/currency.brand'
import CurrencySelectListItem from './CurrencySelectListItem'
import {type Atom, type WritableAtom} from 'jotai'
import {FlatList} from 'react-native'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'

interface Props {
  currencies: Array<Atom<CurrencyInfo>>
  selectedCurrencyCodeAtom: Atom<CurrencyCode | undefined>
  onItemPress: () => void
  updateCurrencyLimitsAtom: WritableAtom<
    null,
    [
      {
        currency: CurrencyCode
      }
    ],
    boolean
  >
}

function renderItem(
  currencyAtom: Atom<CurrencyInfo>,
  selectedCurrencyCodeAtom: Atom<CurrencyCode | undefined>,
  onItemPress: () => void,
  updateCurrencyLimitsAtom: WritableAtom<
    null,
    [
      {
        currency: CurrencyCode
      }
    ],
    boolean
  >
): JSX.Element {
  return (
    <CurrencySelectListItem
      currencyAtom={currencyAtom}
      selectedCurrencyCodeAtom={selectedCurrencyCodeAtom}
      onItemPress={onItemPress}
      updateCurrencyLimitsAtom={updateCurrencyLimitsAtom}
    />
  )
}

function ItemSeparatorComponent(): JSX.Element {
  return <Stack h={2} bc={'$greyAccent1'} />
}
function CurrenciesList({
  currencies,
  selectedCurrencyCodeAtom,
  onItemPress,
  updateCurrencyLimitsAtom,
}: Props): JSX.Element {
  return (
    <FlatList
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      data={currencies}
      ItemSeparatorComponent={ItemSeparatorComponent}
      renderItem={({item: currencyAtom}) =>
        renderItem(
          currencyAtom,
          selectedCurrencyCodeAtom,
          onItemPress,
          updateCurrencyLimitsAtom
        )
      }
      keyExtractor={atomKeyExtractor}
    />
  )
}

export default CurrenciesList

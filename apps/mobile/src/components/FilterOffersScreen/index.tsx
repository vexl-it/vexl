import Screen from '../Screen'
import {type RootStackScreenProps} from '../../navigationTypes'
import React from 'react'
import FilterOffersContent from './FilterOffersContent'
import FilterOffersScopeProvider from '../FilterOffersScopeProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'

type Props = RootStackScreenProps<'FilterOffers'>

function FilterOffersScreen({
  route: {
    params: {type},
  },
}: Props): JSX.Element {
  const safeGoBack = useSafeGoBack()
  return (
    <Screen customHorizontalPadding={0} customVerticalPadding={32}>
      <FilterOffersScopeProvider type={type}>
        <FilterOffersContent navigateBack={safeGoBack} />
      </FilterOffersScopeProvider>
    </Screen>
  )
}

export default FilterOffersScreen

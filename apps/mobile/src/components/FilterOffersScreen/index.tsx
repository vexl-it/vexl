import Screen from '../Screen'
import {type RootStackScreenProps} from '../../navigationTypes'
import React from 'react'
import FilterOffersContent from './FilterOffersContent'
import FilterOffersScopeProvider from '../FilterOffersScopeProvider'

type Props = RootStackScreenProps<'FilterOffers'>

function FilterOffersScreen({
  route: {
    params: {type},
  },
  navigation,
}: Props): JSX.Element {
  return (
    <Screen customHorizontalPadding={0} customVerticalPadding={32}>
      <FilterOffersScopeProvider type={type}>
        <FilterOffersContent
          navigateBack={() => {
            navigation.goBack()
          }}
        />
      </FilterOffersScopeProvider>
    </Screen>
  )
}

export default FilterOffersScreen

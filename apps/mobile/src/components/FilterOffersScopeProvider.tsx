import React from 'react'
import {ScopeProvider} from 'jotai-molecules'
import {
  FilterOffersScope,
  offersFilterInitialStateBuy,
  offersFilterInitialStateSell,
} from './FilterOffersScreen/atom'
import {type OfferType} from '@vexl-next/domain/dist/general/offers'
interface Props {
  children: React.ReactNode
  type: OfferType
}
function FilterOffersScopeProvider({children, type}: Props): JSX.Element {
  return (
    <ScopeProvider
      scope={FilterOffersScope}
      value={
        type === 'BUY'
          ? offersFilterInitialStateBuy
          : offersFilterInitialStateSell
      }
    >
      {children}
    </ScopeProvider>
  )
}

export default FilterOffersScopeProvider

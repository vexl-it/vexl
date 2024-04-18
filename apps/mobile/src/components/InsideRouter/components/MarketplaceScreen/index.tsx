import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {triggerOffersRefreshAtom} from '../../../../state/marketplace'
import {useAppState} from '../../../../utils/useAppState'
import OffersListStateDisplayerContent from './components/OffersListStateDisplayerContent'

function MarketplaceScreen(): JSX.Element {
  const refreshOffers = useSetAtom(triggerOffersRefreshAtom)

  useAppState(
    useCallback(
      (state) => {
        if (state === 'active') {
          void refreshOffers()
        }
      },
      [refreshOffers]
    )
  )

  return <OffersListStateDisplayerContent />
}

export default MarketplaceScreen

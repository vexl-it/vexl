import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {triggerOffersRefreshAtom} from '../../../../state/marketplace'
import {useHandleRedirectToContactsScreen} from '../../../../state/useHandleRedirectToContactsScreen'
import {useAppState} from '../../../../utils/useAppState'
import OffersListStateDisplayerContent from './components/OffersListStateDisplayerContent'

function MarketplaceScreen(): JSX.Element {
  const refreshOffers = useSetAtom(triggerOffersRefreshAtom)

  useHandleRedirectToContactsScreen()

  useAppState(
    useCallback(
      (state) => {
        if (state === 'active') {
          Effect.runFork(refreshOffers())
        }
      },
      [refreshOffers]
    )
  )

  return <OffersListStateDisplayerContent />
}

export default MarketplaceScreen

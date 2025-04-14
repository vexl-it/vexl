import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {refreshOffersActionAtom} from '../../../../state/marketplace/atoms/refreshOffersActionAtom'
import {useHandleRedirectToContactsScreen} from '../../../../state/useHandleRedirectToContactsScreen'
import {useAppState} from '../../../../utils/useAppState'
import OffersListStateDisplayerContent from './components/OffersListStateDisplayerContent'

function MarketplaceScreen(): JSX.Element {
  const refreshOffers = useSetAtom(refreshOffersActionAtom)

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

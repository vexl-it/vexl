import {Screen} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {refreshOffersActionAtom} from '../../../../state/marketplace/atoms/refreshOffersActionAtom'
import {useHandleRedirectToContactsScreen} from '../../../../state/useHandleRedirectToContactsScreen'
import {useAppState} from '../../../../utils/useAppState'
import InsideNavigationBar from '../InsideNavigationBar'
import OffersListStateDisplayerContent from './components/OffersListStateDisplayerContent'

function MarketplaceScreen(): React.ReactElement {
  const insets = useSafeAreaInsets()
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

  return (
    <Screen
      graphicHeader
      topInset={insets.top}
      navigationBar={<InsideNavigationBar />}
    >
      <OffersListStateDisplayerContent />
    </Screen>
  )
}

export default MarketplaceScreen

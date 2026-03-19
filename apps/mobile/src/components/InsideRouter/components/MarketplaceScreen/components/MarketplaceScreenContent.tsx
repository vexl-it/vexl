import {type FlashListRef} from '@shopify/flash-list'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {type TabItem, Tabs} from '@vexl-next/ui'
import {Effect} from 'effect'
import {type Atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo, useRef} from 'react'
import {Stack} from 'tamagui'
import {useAreOffersLoading} from '../../../../../state/marketplace'
import {filteredOffersIncludingLocationFilterAtomsAtom} from '../../../../../state/marketplace/atoms/filteredOffers'
import {myOffersSortedAtomsAtom} from '../../../../../state/marketplace/atoms/myOffers'
import {refreshOffersActionAtom} from '../../../../../state/marketplace/atoms/refreshOffersActionAtom'
import {useHandleRedirectToContactsScreen} from '../../../../../state/useHandleRedirectToContactsScreen'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useAppState} from '../../../../../utils/useAppState'
import OffersList from '../../../../OffersList'
import {InsideScreenListHeader, useInsideScreenScroll} from '../../InsideScreen'
import {type MarketplaceTab} from '../index'
import AllOffersListHeader from './AllOffersListHeader'
import MyOffersEmptyList from './MyOffersEmptyList'
import MyOffersListHeader from './MyOffersListHeader'

function useTabs(): ReadonlyArray<TabItem<MarketplaceTab>> {
  const {t} = useTranslation()
  return useMemo(
    () => [
      {label: t('common.allOffers'), value: 'allOffers'},
      {label: t('common.myOffers'), value: 'myOffers'},
    ],
    [t]
  )
}

function MarketplaceScreenContent({
  activeTab,
  onActiveTabChange,
}: {
  readonly activeTab: MarketplaceTab
  readonly onActiveTabChange: (tab: MarketplaceTab) => void
}): React.ReactElement {
  const refreshOffers = useSetAtom(refreshOffersActionAtom)
  const loading = useAreOffersLoading()
  const offersAtoms = useAtomValue(
    filteredOffersIncludingLocationFilterAtomsAtom
  )
  const myOffersSortedAtoms = useAtomValue(myOffersSortedAtomsAtom)

  const {scrollY, onScroll} = useInsideScreenScroll()
  const flashListRef = useRef<FlashListRef<Atom<OneOfferInState>>>(null)
  const tabs = useTabs()

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

  const handleTabPress = useCallback(
    (tab: MarketplaceTab) => {
      onActiveTabChange(tab)
      scrollY.value = 0
      flashListRef.current?.scrollToOffset({offset: 0, animated: false})
    },
    [onActiveTabChange, scrollY]
  )

  const handleRefresh = useCallback(() => {
    Effect.runFork(refreshOffers())
  }, [refreshOffers])

  const listHeaderComponent = useMemo(
    () => (
      <InsideScreenListHeader>
        <Stack>
          <Tabs tabs={tabs} activeTab={activeTab} onTabPress={handleTabPress} />
        </Stack>
        {activeTab === 'allOffers' ? (
          <AllOffersListHeader scrollY={scrollY} />
        ) : (
          <MyOffersListHeader />
        )}
      </InsideScreenListHeader>
    ),
    [activeTab, handleTabPress, scrollY, tabs]
  )

  return (
    <Stack f={1}>
      <OffersList
        ref={flashListRef}
        ListHeaderComponent={listHeaderComponent}
        ListEmptyComponent={
          activeTab === 'myOffers' ? MyOffersEmptyList : undefined
        }
        offersAtoms={
          activeTab === 'allOffers' ? offersAtoms : myOffersSortedAtoms
        }
        onRefresh={activeTab === 'allOffers' ? handleRefresh : undefined}
        refreshing={activeTab === 'allOffers' ? loading : undefined}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />
    </Stack>
  )
}

export default MarketplaceScreenContent

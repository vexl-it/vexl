import {type TabItem, Tabs} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo, useRef} from 'react'
import {Stack} from 'tamagui'
import {useAreOffersLoading} from '../../../../../state/marketplace'
import {filteredOffersIncludingLocationFilterAtomsAtom} from '../../../../../state/marketplace/atoms/filteredOffers'
import {myOffersSortedAtomsAtom} from '../../../../../state/marketplace/atoms/myOffers'
import {areThereOffersToSeeInMarketplaceWithoutFiltersAtom} from '../../../../../state/marketplace/atoms/offersToSeeInMarketplace'
import {refreshOffersActionAtom} from '../../../../../state/marketplace/atoms/refreshOffersActionAtom'
import {useHandleRedirectToContactsScreen} from '../../../../../state/useHandleRedirectToContactsScreen'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useAppState} from '../../../../../utils/useAppState'
import OffersList from '../../../../OffersList'
import {InsideScreenListHeader, useInsideScreenScroll} from '../../InsideScreen'
import {type MarketplaceTab} from '../index'
import AllOffersListHeader from './AllOffersListHeader'
import FilteredOffersEmptyState from './FilteredOffersEmptyState'
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

function AllOffersTabContent({
  onTabPress,
  scrollToTopRef,
  tabs,
}: {
  readonly onTabPress: (tab: MarketplaceTab) => void
  readonly scrollToTopRef: React.RefObject<(() => void) | null>
  readonly tabs: ReadonlyArray<TabItem<MarketplaceTab>>
}): React.ReactElement {
  const offersAtoms = useAtomValue(
    filteredOffersIncludingLocationFilterAtomsAtom
  )
  const areThereOffersWithoutFilters = useAtomValue(
    areThereOffersToSeeInMarketplaceWithoutFiltersAtom
  )
  const loading = useAreOffersLoading()
  const refreshOffers = useSetAtom(refreshOffersActionAtom)
  const {scrollY, onScroll} = useInsideScreenScroll()

  const handleRefresh = useCallback(() => {
    Effect.runFork(refreshOffers())
  }, [refreshOffers])

  const listHeaderComponent = useMemo(
    () => (
      <InsideScreenListHeader>
        <Stack paddingLeft="$5">
          <Tabs tabs={tabs} activeTab="allOffers" onTabPress={onTabPress} />
        </Stack>
        <AllOffersListHeader
          filteredOffersCount={offersAtoms.length}
          scrollY={scrollY}
        />
      </InsideScreenListHeader>
    ),
    [offersAtoms.length, onTabPress, scrollY, tabs]
  )

  return (
    <OffersList
      scrollToTopRef={scrollToTopRef}
      ListHeaderComponent={listHeaderComponent}
      ListEmptyComponent={
        areThereOffersWithoutFilters ? FilteredOffersEmptyState : undefined
      }
      offersAtoms={offersAtoms}
      onRefresh={handleRefresh}
      refreshing={loading}
      onScroll={onScroll}
      scrollEventThrottle={16}
    />
  )
}

function MyOffersTabContent({
  onTabPress,
  scrollToTopRef,
  tabs,
}: {
  readonly onTabPress: (tab: MarketplaceTab) => void
  readonly scrollToTopRef: React.RefObject<(() => void) | null>
  readonly tabs: ReadonlyArray<TabItem<MarketplaceTab>>
}): React.ReactElement {
  const myOffersSortedAtoms = useAtomValue(myOffersSortedAtomsAtom)
  const {onScroll} = useInsideScreenScroll()

  const listHeaderComponent = useMemo(
    () => (
      <InsideScreenListHeader>
        <Stack paddingLeft="$5">
          <Tabs tabs={tabs} activeTab="myOffers" onTabPress={onTabPress} />
        </Stack>
        <MyOffersListHeader />
      </InsideScreenListHeader>
    ),
    [onTabPress, tabs]
  )

  return (
    <OffersList
      scrollToTopRef={scrollToTopRef}
      ListHeaderComponent={listHeaderComponent}
      ListEmptyComponent={MyOffersEmptyList}
      offersAtoms={myOffersSortedAtoms}
      onScroll={onScroll}
      scrollEventThrottle={16}
    />
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
  const {scrollY} = useInsideScreenScroll()
  const scrollToTopRef = useRef<(() => void) | null>(null)
  const tabs = useTabs()

  useHandleRedirectToContactsScreen()

  const handleTabPress = useCallback(
    (tab: MarketplaceTab) => {
      onActiveTabChange(tab)
      scrollY.value = 0
      scrollToTopRef.current?.()
    },
    [onActiveTabChange, scrollY]
  )

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
    <Stack f={1}>
      {activeTab === 'allOffers' ? (
        <AllOffersTabContent
          onTabPress={handleTabPress}
          scrollToTopRef={scrollToTopRef}
          tabs={tabs}
        />
      ) : (
        <MyOffersTabContent
          onTabPress={handleTabPress}
          scrollToTopRef={scrollToTopRef}
          tabs={tabs}
        />
      )}
    </Stack>
  )
}

export default MarketplaceScreenContent

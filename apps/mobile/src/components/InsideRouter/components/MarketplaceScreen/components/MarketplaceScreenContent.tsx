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

function MarketplaceListHeader({
  activeTab,
  filteredOffersCount,
  onFilterChange,
  onTabPress,
  tabs,
}: {
  readonly activeTab: MarketplaceTab
  readonly filteredOffersCount: number
  readonly onFilterChange: () => void
  readonly onTabPress: (tab: MarketplaceTab) => void
  readonly tabs: ReadonlyArray<TabItem<MarketplaceTab>>
}): React.ReactElement {
  return (
    <InsideScreenListHeader>
      <Stack paddingLeft="$5">
        <Tabs tabs={tabs} activeTab={activeTab} onTabPress={onTabPress} />
      </Stack>
      {activeTab === 'allOffers' ? (
        <AllOffersListHeader
          filteredOffersCount={filteredOffersCount}
          onFilterChange={onFilterChange}
        />
      ) : (
        <MyOffersListHeader />
      )}
    </InsideScreenListHeader>
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
  const {scrollY, onScroll} = useInsideScreenScroll()
  const scrollToTopRef = useRef<(() => void) | null>(null)
  const tabs = useTabs()
  const allOffersAtoms = useAtomValue(
    filteredOffersIncludingLocationFilterAtomsAtom
  )
  const myOffersSortedAtoms = useAtomValue(myOffersSortedAtomsAtom)
  const areThereOffersWithoutFilters = useAtomValue(
    areThereOffersToSeeInMarketplaceWithoutFiltersAtom
  )
  const loading = useAreOffersLoading()

  useHandleRedirectToContactsScreen()

  const scrollListToTop = useCallback(() => {
    scrollY.value = 0
    scrollToTopRef.current?.()
  }, [scrollY])

  const handleTabPress = useCallback(
    (tab: MarketplaceTab) => {
      onActiveTabChange(tab)
      scrollListToTop()
    },
    [onActiveTabChange, scrollListToTop]
  )

  const handleRefresh = useCallback(() => {
    Effect.runFork(refreshOffers())
  }, [refreshOffers])

  const listHeaderComponent = useMemo(
    () => (
      <MarketplaceListHeader
        activeTab={activeTab}
        filteredOffersCount={allOffersAtoms.length}
        onFilterChange={scrollListToTop}
        onTabPress={handleTabPress}
        tabs={tabs}
      />
    ),
    [activeTab, allOffersAtoms.length, handleTabPress, scrollListToTop, tabs]
  )

  const offersAtoms =
    activeTab === 'allOffers' ? allOffersAtoms : myOffersSortedAtoms

  const listEmptyComponent =
    activeTab === 'allOffers'
      ? areThereOffersWithoutFilters
        ? FilteredOffersEmptyState
        : undefined
      : MyOffersEmptyList

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
      <OffersList
        scrollToTopRef={scrollToTopRef}
        ListHeaderComponent={listHeaderComponent}
        ListEmptyComponent={listEmptyComponent}
        offersAtoms={offersAtoms}
        onRefresh={activeTab === 'allOffers' ? handleRefresh : undefined}
        refreshing={activeTab === 'allOffers' ? loading : false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        maintainVisibleContentPosition={{disabled: true}}
      />
    </Stack>
  )
}

export default MarketplaceScreenContent

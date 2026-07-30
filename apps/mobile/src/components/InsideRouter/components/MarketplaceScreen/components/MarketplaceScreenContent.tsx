import {useFocusEffect} from '@react-navigation/native'
import {type TabItem, Tabs} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {type LayoutChangeEvent} from 'react-native'
import {Stack} from 'tamagui'
import {useAreOffersLoading} from '../../../../../state/marketplace'
import {isMarketplaceNarrowingActiveAtom} from '../../../../../state/marketplace/atoms/filterAtoms'
import {
  marketplaceListDataAtom,
  visibleMarketplaceOffersCountAtom,
} from '../../../../../state/marketplace/atoms/marketplaceSections'
import {myOffersListDataAtom} from '../../../../../state/marketplace/atoms/myOffers'
import {areThereOffersToSeeInMarketplaceWithoutFiltersAtom} from '../../../../../state/marketplace/atoms/offersToSeeInMarketplace'
import {
  marketplaceFirstOfferBannerAtom,
  shouldShowMissingProductCategoriesInMyOffersSuggestionAtom,
} from '../../../../../state/marketplace/atoms/offerSuggestionVisible'
import {refreshOffersActionAtom} from '../../../../../state/marketplace/atoms/refreshOffersActionAtom'
import {showMarketplaceIntroDialogIfNeededActionAtom} from '../../../../../state/marketplace/atoms/showMarketplaceIntroDialogIfNeededActionAtom'
import {useHandleRedirectToContactsScreen} from '../../../../../state/useHandleRedirectToContactsScreen'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {
  runAfterAnimationFrame,
  runAfterTwoAnimationFrames,
} from '../../../../../utils/runAfterAnimationFrames'
import {useAppState} from '../../../../../utils/useAppState'
import useScrollToTopOnFocus from '../../../../../utils/useScrollToTopOnFocus'
import MarketplaceLoadingOverlay from '../../../../MarketplaceLoadingOverlay'
import OffersList from '../../../../OffersList'
import RetainedScene from '../../../../RetainedScene'
import {InsideScreenListHeader, useInsideScreenScroll} from '../../InsideScreen'
import {type MarketplaceTab} from '../index'
import AllOffersListHeader from './AllOffersListHeader'
import FewFilteredOffersNotice, {
  shouldShowFewFilteredOffersNotice,
} from './FewFilteredOffersNotice'
import FilteredOffersEmptyState from './FilteredOffersEmptyState'
import MarketplaceFirstOfferBanner from './MarketplaceFirstOfferBanner'
import MissingProductCategoriesMarketplaceSuggestion from './MissingProductCategoriesMarketplaceSuggestion'
import MyOffersEmptyList from './MyOffersEmptyList'
import MyOffersListHeader from './MyOffersListHeader'

type ScrollToTopRef = React.RefObject<(() => void) | null>

interface MarketplaceSceneProps {
  readonly activeTab: MarketplaceTab
  readonly onTabPress: (tab: MarketplaceTab) => void
  readonly scrollToTopRef: ScrollToTopRef
  readonly tabs: ReadonlyArray<TabItem<MarketplaceTab>>
}

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
  children,
  onLayout,
  onTabPress,
  tabs,
}: {
  readonly activeTab: MarketplaceTab
  readonly children: React.ReactNode
  readonly onLayout?: (event: LayoutChangeEvent) => void
  readonly onTabPress: (tab: MarketplaceTab) => void
  readonly tabs: ReadonlyArray<TabItem<MarketplaceTab>>
}): React.ReactElement {
  return (
    <Stack onLayout={onLayout}>
      <InsideScreenListHeader>
        <Stack paddingLeft="$5">
          <Tabs tabs={tabs} activeTab={activeTab} onTabPress={onTabPress} />
        </Stack>
        {children}
      </InsideScreenListHeader>
    </Stack>
  )
}

function MyOffersHeaderContent(): React.ReactElement {
  const shouldShowMissingProductCategoriesSuggestion = useAtomValue(
    shouldShowMissingProductCategoriesInMyOffersSuggestionAtom
  )

  return (
    <>
      <MyOffersListHeader />
      {shouldShowMissingProductCategoriesSuggestion ? (
        <Stack paddingTop="$5" paddingBottom="$5" paddingHorizontal="$5">
          <MissingProductCategoriesMarketplaceSuggestion placement="myOffers" />
        </Stack>
      ) : null}
    </>
  )
}

const AllOffersScene = React.memo(function AllOffersScene({
  activeTab,
  onTabPress,
  scrollToTopRef,
  tabs,
}: MarketplaceSceneProps): React.ReactElement {
  const {t} = useTranslation()
  const refreshOffers = useSetAtom(refreshOffersActionAtom)
  const {scrollY, onScroll} = useInsideScreenScroll()
  const marketplaceListData = useAtomValue(marketplaceListDataAtom)
  const visibleOffersCount = useAtomValue(visibleMarketplaceOffersCountAtom)
  const areThereOffersWithoutFilters = useAtomValue(
    areThereOffersToSeeInMarketplaceWithoutFiltersAtom
  )
  const isMarketplaceNarrowingActive = useAtomValue(
    isMarketplaceNarrowingActiveAtom
  )
  const marketplaceFirstOfferBanner = useAtomValue(
    marketplaceFirstOfferBannerAtom
  )
  const loading = useAreOffersLoading()
  const [isPullToRefreshActive, setIsPullToRefreshActive] = useState(false)
  const [listHeaderHeight, setListHeaderHeight] = useState(0)
  const [isFilterTransitionPending, setIsFilterTransitionPending] =
    useState(false)
  const filterTransitionPendingRef = useRef(false)
  const isWaitingForFilterListCommitRef = useRef(false)
  const cancelPendingOverlayHideFrameRef = useRef<(() => void) | undefined>(
    undefined
  )

  const scrollListToTop = useCallback(() => {
    scrollY.value = 0
    scrollToTopRef.current?.()
  }, [scrollToTopRef, scrollY])

  const handleFilterChangeStart = useCallback(() => {
    scrollListToTop()
    filterTransitionPendingRef.current = true
    isWaitingForFilterListCommitRef.current = false
    cancelPendingOverlayHideFrameRef.current?.()
    cancelPendingOverlayHideFrameRef.current = undefined
    setIsFilterTransitionPending(true)
  }, [scrollListToTop])

  const handleFilterChangeCancel = useCallback(() => {
    cancelPendingOverlayHideFrameRef.current?.()
    cancelPendingOverlayHideFrameRef.current = undefined
    filterTransitionPendingRef.current = false
    isWaitingForFilterListCommitRef.current = false
    setIsFilterTransitionPending(false)
  }, [])

  const handleListHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height
    setListHeaderHeight((currentHeight) =>
      currentHeight === nextHeight ? currentHeight : nextHeight
    )
  }, [])

  const handleFilterChange = useCallback(() => {
    if (filterTransitionPendingRef.current) {
      isWaitingForFilterListCommitRef.current = true
    }
    scrollListToTop()
  }, [scrollListToTop])

  const handleOffersListCommit = useCallback(() => {
    if (
      !filterTransitionPendingRef.current ||
      !isWaitingForFilterListCommitRef.current
    ) {
      return
    }

    isWaitingForFilterListCommitRef.current = false
    cancelPendingOverlayHideFrameRef.current?.()
    cancelPendingOverlayHideFrameRef.current = runAfterAnimationFrame(() => {
      cancelPendingOverlayHideFrameRef.current = undefined
      filterTransitionPendingRef.current = false
      setIsFilterTransitionPending(false)
    })
  }, [])

  const handleRefresh = useCallback(() => {
    setIsPullToRefreshActive(true)
    Effect.runFork(
      refreshOffers({forceRemovedOffersReconciliation: true}).pipe(
        Effect.ensuring(
          Effect.sync(() => {
            setIsPullToRefreshActive(false)
          })
        )
      )
    )
  }, [refreshOffers])

  const listHeaderComponent = useMemo(
    () => (
      <MarketplaceListHeader
        activeTab={activeTab}
        onLayout={handleListHeaderLayout}
        onTabPress={onTabPress}
        tabs={tabs}
      >
        <AllOffersListHeader
          filteredOffersCount={visibleOffersCount}
          isOffersLoaderVisible={loading}
          onFilterChange={handleFilterChange}
          onFilterChangeCancel={handleFilterChangeCancel}
          onFilterChangeStart={handleFilterChangeStart}
        />
      </MarketplaceListHeader>
    ),
    [
      handleFilterChange,
      handleFilterChangeCancel,
      handleFilterChangeStart,
      handleListHeaderLayout,
      loading,
      activeTab,
      onTabPress,
      tabs,
      visibleOffersCount,
    ]
  )

  const listFooterComponent = useMemo(
    () =>
      shouldShowFewFilteredOffersNotice({
        isMarketplaceNarrowingActive,
        offersCount: visibleOffersCount,
      }) ? (
        <FewFilteredOffersNotice />
      ) : null,
    [visibleOffersCount, isMarketplaceNarrowingActive]
  )

  const itemAfterFirstOffer = useMemo(
    () =>
      marketplaceFirstOfferBanner != null ? (
        <MarketplaceFirstOfferBanner
          marketplaceFirstOfferBanner={marketplaceFirstOfferBanner}
        />
      ) : null,
    [marketplaceFirstOfferBanner]
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

  useEffect(() => {
    return () => {
      cancelPendingOverlayHideFrameRef.current?.()
    }
  }, [])

  return (
    <Stack f={1}>
      <OffersList
        scrollToTopRef={scrollToTopRef}
        ListHeaderComponent={listHeaderComponent}
        ListEmptyComponent={
          areThereOffersWithoutFilters ? FilteredOffersEmptyState : undefined
        }
        ListFooterComponent={listFooterComponent}
        items={marketplaceListData}
        itemAfterFirstOffer={itemAfterFirstOffer}
        onRefresh={handleRefresh}
        // Programmatically activating RefreshControl changes the content inset
        // on iOS. Drive it only from an actual pull, never a background refresh.
        // Existing offers use the inline header loader to avoid two indicators.
        refreshing={
          areThereOffersWithoutFilters ? false : isPullToRefreshActive
        }
        onScroll={activeTab === 'allOffers' ? onScroll : undefined}
        scrollEventThrottle={16}
        maintainVisibleContentPosition={{disabled: true}}
        onCommitLayoutEffect={handleOffersListCommit}
      />
      <MarketplaceLoadingOverlay
        label={t('marketplace.loadingOffers')}
        top={listHeaderHeight}
        visible={isFilterTransitionPending}
      />
    </Stack>
  )
})

const MyOffersScene = React.memo(function MyOffersScene({
  activeTab,
  onTabPress,
  scrollToTopRef,
  tabs,
}: MarketplaceSceneProps): React.ReactElement {
  const {onScroll} = useInsideScreenScroll()
  const myOffersItems = useAtomValue(myOffersListDataAtom)

  const listHeaderComponent = useMemo(
    () => (
      <MarketplaceListHeader
        activeTab={activeTab}
        onTabPress={onTabPress}
        tabs={tabs}
      >
        <MyOffersHeaderContent />
      </MarketplaceListHeader>
    ),
    [activeTab, onTabPress, tabs]
  )

  return (
    <OffersList
      scrollToTopRef={scrollToTopRef}
      ListHeaderComponent={listHeaderComponent}
      ListEmptyComponent={MyOffersEmptyList}
      items={myOffersItems}
      onScroll={activeTab === 'myOffers' ? onScroll : undefined}
      scrollEventThrottle={16}
      maintainVisibleContentPosition={{disabled: true}}
    />
  )
})

function AllOffersActiveEffects({
  isActive,
}: {
  readonly isActive: boolean
}): null {
  const areThereOffersWithoutFilters = useAtomValue(
    areThereOffersToSeeInMarketplaceWithoutFiltersAtom
  )
  const showMarketplaceIntroDialogIfNeeded = useSetAtom(
    showMarketplaceIntroDialogIfNeededActionAtom
  )

  useFocusEffect(
    useCallback(() => {
      if (!isActive || !areThereOffersWithoutFilters) {
        return undefined
      }

      Effect.runFork(showMarketplaceIntroDialogIfNeeded())

      return undefined
    }, [
      areThereOffersWithoutFilters,
      isActive,
      showMarketplaceIntroDialogIfNeeded,
    ])
  )

  return null
}

function MarketplaceScreenContent({
  activeTab,
  onActiveTabChange,
  scrollToTopRequestId,
}: {
  readonly activeTab: MarketplaceTab
  readonly onActiveTabChange: (tab: MarketplaceTab) => void
  readonly scrollToTopRequestId: string | undefined
}): React.ReactElement {
  const {scrollY} = useInsideScreenScroll()
  const tabs = useTabs()
  const allOffersScrollToTopRef = useRef<(() => void) | null>(null)
  const myOffersScrollToTopRef = useRef<(() => void) | null>(null)
  const [shouldMountInactiveScene, setShouldMountInactiveScene] =
    useState(false)

  useHandleRedirectToContactsScreen()

  const scrollTabToTop = useCallback(
    (tab: MarketplaceTab) => {
      scrollY.value = 0
      if (tab === 'allOffers') {
        allOffersScrollToTopRef.current?.()
        return
      }

      myOffersScrollToTopRef.current?.()
    },
    [scrollY]
  )

  const scrollActiveTabToTop = useCallback(() => {
    scrollTabToTop(activeTab)
  }, [activeTab, scrollTabToTop])

  useLayoutEffect(() => {
    scrollTabToTop(activeTab)
  }, [activeTab, scrollTabToTop])

  useScrollToTopOnFocus({
    requestId: scrollToTopRequestId,
    scrollToTop: scrollActiveTabToTop,
  })

  useEffect(() => {
    return runAfterTwoAnimationFrames(() => {
      setShouldMountInactiveScene(true)
    })
  }, [])

  return (
    <Stack f={1} position="relative">
      {activeTab === 'allOffers' || shouldMountInactiveScene ? (
        <RetainedScene isActive={activeTab === 'allOffers'}>
          <AllOffersScene
            activeTab={activeTab}
            onTabPress={onActiveTabChange}
            scrollToTopRef={allOffersScrollToTopRef}
            tabs={tabs}
          />
          <AllOffersActiveEffects isActive={activeTab === 'allOffers'} />
        </RetainedScene>
      ) : null}
      {activeTab === 'myOffers' || shouldMountInactiveScene ? (
        <RetainedScene isActive={activeTab === 'myOffers'}>
          <MyOffersScene
            activeTab={activeTab}
            onTabPress={onActiveTabChange}
            scrollToTopRef={myOffersScrollToTopRef}
            tabs={tabs}
          />
        </RetainedScene>
      ) : null}
    </Stack>
  )
}

export default MarketplaceScreenContent

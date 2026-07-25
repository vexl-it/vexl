import {
  FlashList,
  type FlashListProps,
  type FlashListRef,
  type ListRenderItemInfo,
} from '@shopify/flash-list'
import {Stack, tokens, useTheme} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {RefreshControl, type View, type ViewProps} from 'react-native'
import Animated, {
  LinearTransition,
  type AnimatedProps,
} from 'react-native-reanimated'
import usePixelsFromBottomWhereTabsEnd from '../InsideRouter/utils'
import OffersListItem from './OffersListItem'
import OffersListSectionHeader from './OffersListSectionHeader'
import {type OffersListItemData} from './domain'
import {OffersListAnimationProvider} from './offersListAnimation'

interface ItemSeparatorProps {
  readonly leadingItem?: OffersListItemData
  readonly trailingItem?: OffersListItemData
}

const ReanimatedFlashList: React.ComponentType<any> =
  Animated.createAnimatedComponent(FlashList)

const OFFERS_LIST_LAYOUT_TRANSITION_DURATION_MS = 300
const OFFERS_LIST_CHANGE_COMMIT_TIMEOUT_MS = 1000
const offersListLayoutTransition = LinearTransition.duration(
  OFFERS_LIST_LAYOUT_TRANSITION_DURATION_MS
)

interface PendingListChange {
  readonly applyChange: () => void
  readonly complete: () => void
}

interface OffersListCellAnimationState {
  // FlashList repositions recycled cells while scrolling. Keeping a layout
  // transition mounted continuously would animate those recycling updates, so
  // it is enabled only for the explicitly armed mark-change render.
  readonly shouldAnimateLayout: boolean
  readonly exitingItemKey: string | null
  readonly getItemKey: (index: number) => string | undefined
}

const OffersListCellAnimationContext =
  React.createContext<OffersListCellAnimationState>({
    shouldAnimateLayout: false,
    exitingItemKey: null,
    getItemKey: () => undefined,
  })

const AnimatedCellContainer = React.forwardRef<
  View,
  AnimatedProps<ViewProps> & {readonly index: number}
>(function AnimatedCellContainer({index, style, ...props}, ref) {
  const {shouldAnimateLayout, exitingItemKey, getItemKey} = React.useContext(
    OffersListCellAnimationContext
  )

  // While a marked offer slides towards its new section it must pass under
  // the neighbouring rows, so every other cell is raised above it. Sibling
  // cells otherwise stack in recycle order, which is arbitrary.
  const zIndexStyle =
    exitingItemKey === null
      ? undefined
      : {zIndex: getItemKey(index) === exitingItemKey ? 0 : 1}

  return (
    <Animated.View
      ref={ref}
      layout={shouldAnimateLayout ? offersListLayoutTransition : undefined}
      style={[style, zIndexStyle]}
      {...props}
    />
  )
})

function renderItem(
  info: ListRenderItemInfo<OffersListItemData>
): React.ReactElement {
  if (info.item.type === 'sectionHeader')
    return <OffersListSectionHeader section={info.item.section} />

  return (
    <OffersListItem
      offerAtom={info.item.offerAtom}
      swipeEnabled={info.item.swipeEnabled}
    />
  )
}

function keyExtractor(item: OffersListItemData): string {
  return item.key
}

function getItemType(item: OffersListItemData): string {
  return item.type
}

export interface Props extends Omit<
  FlashListProps<OffersListItemData>,
  | 'renderItem'
  | 'data'
  | 'ListFooterComponent'
  | 'keyExtractor'
  | 'getItemType'
  | 'CellRendererComponent'
> {
  readonly items: readonly OffersListItemData[]
  readonly itemAfterFirstOffer?: React.ReactElement | null
  readonly ListFooterComponent?: React.ReactElement | null
  readonly scrollToTopRef?: React.RefObject<(() => void) | null>
  readonly hideRefreshIndicator?: boolean
}

function OffersList({
  onRefresh,
  refreshing,
  hideRefreshIndicator,
  items,
  itemAfterFirstOffer,
  scrollToTopRef,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  contentContainerStyle: externalContentContainerStyle,
  onCommitLayoutEffect,
  ...props
}: Props): React.JSX.Element {
  const bottomOffset = usePixelsFromBottomWhereTabsEnd()
  const animatedFlashListRef = useRef<FlashListRef<OffersListItemData>>(null)
  const currentItemsRef = useRef(items)
  const itemsBeforeAnimationRef = useRef<readonly OffersListItemData[] | null>(
    null
  )
  const pendingListChangesRef = useRef<readonly PendingListChange[]>([])
  const activeListChangeRef = useRef<PendingListChange | null>(null)
  const hasAppliedActiveListChangeRef = useRef(false)
  const listChangeCommitTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null)
  const listChangeCompletionTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null)
  const resetListAnimationFrameRef = useRef<number | null>(null)
  const isMountedRef = useRef(true)
  const [shouldAnimateListLayout, setShouldAnimateListLayout] = useState(false)
  // Bumped by every arming. React collapses a reset to `false` and a re-arm to
  // `true` queued in the same batch into no update at all, so arming must never
  // rely on shouldAnimateListLayout changing value to re-run the arming effect
  // below - otherwise the queued change would neither be applied nor completed
  // and the queue would stall for the lifetime of the list.
  const [listChangeGeneration, setListChangeGeneration] = useState(0)
  const [exitingItemKey, setExitingItemKey] = useState<string | null>(null)
  const theme = useTheme()
  const refreshIndicatorColor = hideRefreshIndicator
    ? tokens.color.transparent.val
    : theme.foregroundSecondary.get()

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: bottomOffset + Number(tokens.space[5].val),
      ...externalContentContainerStyle,
    }),
    [bottomOffset, externalContentContainerStyle]
  )

  const firstOfferItemKey = useMemo(
    () =>
      pipe(
        items,
        Array.findFirst((one) => one.type === 'offer'),
        Option.map((one) => one.key),
        Option.getOrUndefined
      ),
    [items]
  )

  const offerItemsCount = useMemo(
    () =>
      pipe(
        items,
        Array.filter((one) => one.type === 'offer'),
        Array.length
      ),
    [items]
  )

  const itemSeparatorComponent = useCallback(
    ({leadingItem, trailingItem}: ItemSeparatorProps): React.ReactElement => {
      // checked first so the banner is not dropped when the first offer is
      // also the last offer of its section (trailingItem is a header then)
      if (
        itemAfterFirstOffer != null &&
        leadingItem?.key !== undefined &&
        leadingItem.key === firstOfferItemKey
      ) {
        return (
          <>
            <Stack h="$5" />
            <Stack px="$5">{itemAfterFirstOffer}</Stack>
            <Stack h={trailingItem?.type === 'sectionHeader' ? '$7' : '$5'} />
          </>
        )
      }

      // spacing between the last offer of a section and the next section
      // header
      if (trailingItem?.type === 'sectionHeader') return <Stack h="$7" />
      // spacing between a section header and its first offer
      if (leadingItem?.type === 'sectionHeader') return <Stack h="$5" />

      return <Stack h="$5" />
    },
    [firstOfferItemKey, itemAfterFirstOffer]
  )

  const listFooterComponent = useMemo((): React.ReactElement | null => {
    if (itemAfterFirstOffer == null || offerItemsCount !== 1) {
      return ListFooterComponent ?? null
    }

    return (
      <>
        <Stack h="$5" />
        <Stack px="$5">{itemAfterFirstOffer}</Stack>
        <Stack h="$5" />
        {ListFooterComponent}
      </>
    )
  }, [ListFooterComponent, itemAfterFirstOffer, offerItemsCount])

  const startNextListChange = useCallback(() => {
    if (
      !isMountedRef.current ||
      activeListChangeRef.current !== null ||
      !Array.isNonEmptyReadonlyArray(pendingListChangesRef.current)
    ) {
      return
    }

    const [nextListChange, ...remainingListChanges] =
      pendingListChangesRef.current
    pendingListChangesRef.current = remainingListChanges
    activeListChangeRef.current = nextListChange
    hasAppliedActiveListChangeRef.current = false
    itemsBeforeAnimationRef.current = currentItemsRef.current
    setShouldAnimateListLayout(true)
    setListChangeGeneration((current) => current + 1)
  }, [])

  const animateNextListChange = useCallback(
    (applyChange: () => void): Promise<void> =>
      new Promise((resolve) => {
        if (!isMountedRef.current) {
          applyChange()
          resolve()
          return
        }

        pendingListChangesRef.current = Array.append(
          pendingListChangesRef.current,
          {applyChange, complete: resolve}
        )
        startNextListChange()
      }),
    [startNextListChange]
  )

  // Cells read item keys during render (z-index for the exiting row), so
  // getItemKey derives from items directly; the ref is only for
  // animateNextListChange, which runs after commit, so a layout effect keeps
  // the render phase pure without it ever observing a stale value.
  useLayoutEffect(() => {
    currentItemsRef.current = items
  }, [items])

  // Arms the layout transition for the next queued change. listChangeGeneration
  // is part of the dependencies so a change armed within the same batch as the
  // previous one's reset still re-runs this effect.
  useLayoutEffect(() => {
    if (!shouldAnimateListLayout || activeListChangeRef.current === null) {
      return
    }

    const activeListChange = activeListChangeRef.current
    animatedFlashListRef.current?.prepareForLayoutAnimationRender()
    hasAppliedActiveListChangeRef.current = true
    activeListChange.applyChange()

    // A stale/recycled offer can disappear before its delayed commit runs. In
    // that case the mark action intentionally performs no state write, so no
    // FlashList commit will arrive to complete this animation cycle.
    listChangeCommitTimeoutRef.current = setTimeout(() => {
      if (activeListChangeRef.current !== activeListChange) return

      listChangeCommitTimeoutRef.current = null
      itemsBeforeAnimationRef.current = null
      setShouldAnimateListLayout(false)
      resetListAnimationFrameRef.current = requestAnimationFrame(() => {
        resetListAnimationFrameRef.current = null
        activeListChangeRef.current = null
        hasAppliedActiveListChangeRef.current = false
        activeListChange.complete()
        startNextListChange()
      })
    }, OFFERS_LIST_CHANGE_COMMIT_TIMEOUT_MS)
  }, [listChangeGeneration, shouldAnimateListLayout, startNextListChange])

  const handleCommitLayoutEffect = useCallback(() => {
    onCommitLayoutEffect?.()

    if (!shouldAnimateListLayout || items === itemsBeforeAnimationRef.current) {
      return
    }

    const activeListChange = activeListChangeRef.current
    if (
      activeListChange === null ||
      listChangeCompletionTimeoutRef.current !== null ||
      resetListAnimationFrameRef.current !== null
    ) {
      return
    }

    if (listChangeCommitTimeoutRef.current !== null) {
      clearTimeout(listChangeCommitTimeoutRef.current)
      listChangeCommitTimeoutRef.current = null
    }

    resetListAnimationFrameRef.current = requestAnimationFrame(() => {
      resetListAnimationFrameRef.current = null
      setShouldAnimateListLayout(false)
      itemsBeforeAnimationRef.current = null
    })

    listChangeCompletionTimeoutRef.current = setTimeout(() => {
      listChangeCompletionTimeoutRef.current = null

      // Timers can outrun the frame loop - it stops while the app is
      // backgrounded and overdue timers flush before it resumes - so the reset
      // frame above may still be queued here. Running its work now keeps the
      // animation disarmed before the next change arms itself and prevents the
      // stale frame from disarming that next change mid-flight.
      if (resetListAnimationFrameRef.current !== null) {
        cancelAnimationFrame(resetListAnimationFrameRef.current)
        resetListAnimationFrameRef.current = null
        setShouldAnimateListLayout(false)
        itemsBeforeAnimationRef.current = null
      }

      activeListChangeRef.current = null
      hasAppliedActiveListChangeRef.current = false
      activeListChange.complete()
      startNextListChange()
    }, OFFERS_LIST_LAYOUT_TRANSITION_DURATION_MS)
  }, [
    items,
    onCommitLayoutEffect,
    shouldAnimateListLayout,
    startNextListChange,
  ])

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false

      if (listChangeCommitTimeoutRef.current !== null) {
        clearTimeout(listChangeCommitTimeoutRef.current)
      }
      if (listChangeCompletionTimeoutRef.current !== null) {
        clearTimeout(listChangeCompletionTimeoutRef.current)
      }
      if (resetListAnimationFrameRef.current !== null) {
        cancelAnimationFrame(resetListAnimationFrameRef.current)
      }

      const activeListChange = activeListChangeRef.current
      if (activeListChange !== null && !hasAppliedActiveListChangeRef.current) {
        activeListChange.applyChange()
      }
      activeListChange?.complete()
      Array.forEach(
        pendingListChangesRef.current,
        ({applyChange, complete}) => {
          applyChange()
          complete()
        }
      )
      activeListChangeRef.current = null
      hasAppliedActiveListChangeRef.current = false
      pendingListChangesRef.current = []
    }
  }, [])

  const onOfferExitAnimationStart = useCallback((offerKey: string) => {
    setExitingItemKey(offerKey)
  }, [])

  // Clears only its own key so a commit on another offer that started in the
  // meantime keeps its lowered row.
  const onOfferExitAnimationEnd = useCallback((offerKey: string) => {
    setExitingItemKey((current) => (current === offerKey ? null : current))
  }, [])

  const animationContextValue = useMemo(
    () => ({
      animateNextListChange,
      onOfferExitAnimationStart,
      onOfferExitAnimationEnd,
    }),
    [animateNextListChange, onOfferExitAnimationStart, onOfferExitAnimationEnd]
  )

  const getItemKey = useCallback((index: number) => items[index]?.key, [items])

  const cellAnimationContextValue = useMemo(
    () => ({
      shouldAnimateLayout: shouldAnimateListLayout,
      exitingItemKey,
      getItemKey,
    }),
    [shouldAnimateListLayout, exitingItemKey, getItemKey]
  )

  useEffect(() => {
    if (!scrollToTopRef) return

    scrollToTopRef.current = () => {
      animatedFlashListRef.current?.scrollToOffset({
        offset: 0,
        animated: false,
      })
    }

    return () => {
      scrollToTopRef.current = null
    }
  }, [scrollToTopRef])

  return (
    <OffersListAnimationProvider value={animationContextValue}>
      <OffersListCellAnimationContext.Provider
        value={cellAnimationContextValue}
      >
        <ReanimatedFlashList
          ref={animatedFlashListRef}
          indicatorStyle="white"
          refreshControl={
            <RefreshControl
              colors={[refreshIndicatorColor]}
              progressBackgroundColor={
                hideRefreshIndicator ? tokens.color.transparent.val : undefined
              }
              refreshing={refreshing ?? false}
              onRefresh={onRefresh ?? (() => {})}
              tintColor={refreshIndicatorColor}
            />
          }
          ItemSeparatorComponent={itemSeparatorComponent}
          progressViewOffset={20}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={listFooterComponent}
          ListEmptyComponent={ListEmptyComponent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={contentContainerStyle}
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          CellRendererComponent={AnimatedCellContainer}
          onCommitLayoutEffect={handleCommitLayoutEffect}
          {...props}
        />
      </OffersListCellAnimationContext.Provider>
    </OffersListAnimationProvider>
  )
}

export default OffersList

import {
  FlashList,
  type FlashListProps,
  type FlashListRef,
  type ListRenderItemInfo,
} from '@shopify/flash-list'
import {Stack, tokens, useTheme} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import React, {useCallback, useEffect, useMemo, useRef} from 'react'
import {LayoutAnimation, RefreshControl} from 'react-native'
import Animated from 'react-native-reanimated'
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
  'renderItem' | 'data' | 'ListFooterComponent' | 'keyExtractor' | 'getItemType'
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
  ...props
}: Props): React.JSX.Element {
  const bottomOffset = usePixelsFromBottomWhereTabsEnd()
  const animatedFlashListRef = useRef<FlashListRef<OffersListItemData>>(null)
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

  const animateNextListChange = useCallback(() => {
    animatedFlashListRef.current?.prepareForLayoutAnimationRender()
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        300,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    )
  }, [])

  const animationContextValue = useMemo(
    () => ({animateNextListChange}),
    [animateNextListChange]
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
        {...props}
      />
    </OffersListAnimationProvider>
  )
}

export default OffersList

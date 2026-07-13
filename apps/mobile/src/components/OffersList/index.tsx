import {
  FlashList,
  type FlashListProps,
  type FlashListRef,
  type ListRenderItemInfo,
} from '@shopify/flash-list'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Stack, tokens, useTheme} from '@vexl-next/ui'
import {type Atom} from 'jotai'
import React, {useCallback, useEffect, useMemo, useRef} from 'react'
import {RefreshControl} from 'react-native'
import Animated from 'react-native-reanimated'
import atomKeyExtractor from '../../utils/atomUtils/atomKeyExtractor'
import usePixelsFromBottomWhereTabsEnd from '../InsideRouter/utils'
import OffersListItem from './OffersListItem'

const ItemSeparatorComponent = (): React.ReactElement => <Stack h="$5" />
interface ItemSeparatorProps {
  readonly leadingItem?: Atom<OneOfferInState>
}

const ReanimatedFlashList: React.ComponentType<any> =
  Animated.createAnimatedComponent(FlashList)

function renderItem(
  info: ListRenderItemInfo<Atom<OneOfferInState>>
): React.ReactElement {
  return <OffersListItem offerAtom={info.item} />
}

export interface Props extends Omit<
  FlashListProps<Atom<OneOfferInState>>,
  'renderItem' | 'data' | 'ListFooterComponent'
> {
  readonly offersAtoms: Array<Atom<OneOfferInState>>
  readonly itemAfterFirstOffer?: React.ReactElement | null
  readonly ListFooterComponent?: React.ReactElement | null
  readonly scrollToTopRef?: React.RefObject<(() => void) | null>
  readonly hideRefreshIndicator?: boolean
}

function OffersList({
  onRefresh,
  refreshing,
  hideRefreshIndicator,
  offersAtoms,
  itemAfterFirstOffer,
  scrollToTopRef,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  contentContainerStyle: externalContentContainerStyle,
  ...props
}: Props): React.JSX.Element {
  const bottomOffset = usePixelsFromBottomWhereTabsEnd()
  const animatedFlashListRef = useRef<FlashListRef<Atom<OneOfferInState>>>(null)
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

  const firstOfferAtom = offersAtoms[0]

  const itemSeparatorComponent = useCallback(
    ({leadingItem}: ItemSeparatorProps): React.ReactElement => {
      if (itemAfterFirstOffer != null && leadingItem === firstOfferAtom) {
        return (
          <>
            <Stack h="$5" />
            <Stack px="$5">{itemAfterFirstOffer}</Stack>
            <Stack h="$5" />
          </>
        )
      }

      return <ItemSeparatorComponent />
    },
    [firstOfferAtom, itemAfterFirstOffer]
  )

  const listFooterComponent = useMemo((): React.ReactElement | null => {
    if (itemAfterFirstOffer == null || offersAtoms.length !== 1) {
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
  }, [ListFooterComponent, itemAfterFirstOffer, offersAtoms.length])

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
      data={offersAtoms}
      renderItem={renderItem}
      keyExtractor={atomKeyExtractor}
      {...props}
    />
  )
}

export default OffersList

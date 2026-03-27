import {
  FlashList,
  type FlashListProps,
  type FlashListRef,
  type ListRenderItemInfo,
} from '@shopify/flash-list'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {type Atom} from 'jotai'
import React, {useEffect, useMemo, useRef} from 'react'
import {RefreshControl} from 'react-native'
import Animated from 'react-native-reanimated'
import {getTokens, Stack} from 'tamagui'
import atomKeyExtractor from '../../utils/atomUtils/atomKeyExtractor'
import usePixelsFromBottomWhereTabsEnd from '../InsideRouter/utils'
import OffersListItem from './OffersListItem'

const ItemSeparatorComponent = (): React.ReactElement => <Stack h="$5" />
const ReanimatedFlashList: React.ComponentType<any> =
  Animated.createAnimatedComponent(FlashList)

export interface Props
  extends Omit<FlashListProps<Atom<OneOfferInState>>, 'renderItem' | 'data'> {
  readonly offersAtoms: Array<Atom<OneOfferInState>>
  readonly scrollToTopRef?: React.RefObject<(() => void) | null>
}

function renderItem(
  info: ListRenderItemInfo<Atom<OneOfferInState>>
): React.ReactElement {
  return <OffersListItem isFirst={info.index === 0} offerAtom={info.item} />
}

function OffersList({
  onRefresh,
  refreshing,
  offersAtoms,
  scrollToTopRef,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  contentContainerStyle: externalContentContainerStyle,
  ...props
}: Props): React.JSX.Element {
  const bottomOffset = usePixelsFromBottomWhereTabsEnd()
  const animatedFlashListRef = useRef<FlashListRef<Atom<OneOfferInState>>>(null)

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: bottomOffset + Number(getTokens().space[5].val),
      ...externalContentContainerStyle,
    }),
    [bottomOffset, externalContentContainerStyle]
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
    <ReanimatedFlashList
      ref={animatedFlashListRef}
      indicatorStyle="white"
      refreshControl={
        <RefreshControl
          refreshing={refreshing ?? false}
          onRefresh={onRefresh ?? (() => {})}
          tintColor={getTokens().color.greyAccent5.val}
        />
      }
      ItemSeparatorComponent={ItemSeparatorComponent}
      progressViewOffset={20}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
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

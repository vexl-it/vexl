import {
  FlashList,
  type ContentStyle,
  type FlashListProps,
  type ListRenderItemInfo,
} from '@shopify/flash-list'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {type Atom} from 'jotai'
import React, {useMemo, type ComponentProps} from 'react'
import {type FlatList} from 'react-native'
import Animated from 'react-native-reanimated'
import {getTokens} from 'tamagui'
import atomKeyExtractor from '../../utils/atomUtils/atomKeyExtractor'
import usePixelsFromBottomWhereTabsEnd from '../InsideRouter/utils'
import OffersListItem from './OffersListItem'

export interface Props
  extends Omit<FlashListProps<Atom<OneOfferInState>>, 'renderItem' | 'data'> {
  readonly offersAtoms: Array<Atom<OneOfferInState>>
  ListHeaderComponent?: ComponentProps<typeof FlatList>['ListHeaderComponent']
}

function renderItem(
  info: ListRenderItemInfo<Atom<OneOfferInState>>
): JSX.Element {
  return <OffersListItem isFirst={info.index === 0} offerAtom={info.item} />
}

const AnimatedFlashList =
  Animated.createAnimatedComponent<FlashListProps<Atom<OneOfferInState>>>(
    FlashList
  )

function OffersList({
  onRefresh,
  refreshing,
  offersAtoms,
  ListHeaderComponent,
  ...props
}: Props): JSX.Element {
  const bottomOffset = usePixelsFromBottomWhereTabsEnd()

  const contentContainerStyle: ContentStyle = useMemo(
    () => ({
      paddingBottom: bottomOffset + Number(getTokens().space[5].val),
    }),
    [bottomOffset]
  )

  return (
    <AnimatedFlashList
      ListHeaderComponent={ListHeaderComponent}
      estimatedItemSize={151}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentContainerStyle}
      data={offersAtoms}
      onRefresh={onRefresh}
      refreshing={refreshing}
      renderItem={renderItem}
      keyExtractor={atomKeyExtractor}
      {...props}
    />
  )
}

export default OffersList

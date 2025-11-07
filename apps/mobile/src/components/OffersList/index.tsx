import {
  FlashList,
  type FlashListProps,
  type ListRenderItemInfo,
} from '@shopify/flash-list'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {type Atom} from 'jotai'
import React, {useMemo} from 'react'
import {RefreshControl} from 'react-native'
import {getTokens} from 'tamagui'
import atomKeyExtractor from '../../utils/atomUtils/atomKeyExtractor'
import usePixelsFromBottomWhereTabsEnd from '../InsideRouter/utils'
import OffersListItem from './OffersListItem'

export interface Props
  extends Omit<FlashListProps<Atom<OneOfferInState>>, 'renderItem' | 'data'> {
  readonly offersAtoms: Array<Atom<OneOfferInState>>
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
  ListHeaderComponent,
  ListFooterComponent,
  ...props
}: Props): React.ReactElement {
  const bottomOffset = usePixelsFromBottomWhereTabsEnd()

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: bottomOffset + Number(getTokens().space[5].val),
    }),
    [bottomOffset]
  )

  return (
    <FlashList
      indicatorStyle="white"
      refreshControl={
        <RefreshControl
          refreshing={refreshing ?? false}
          onRefresh={onRefresh ?? (() => {})}
          tintColor={getTokens().color.greyAccent5.val}
        />
      }
      progressViewOffset={20}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
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

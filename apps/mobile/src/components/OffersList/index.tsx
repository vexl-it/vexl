import OffersListItem from './OffersListItem'
import {type FlatList} from 'react-native'
import {type OneOfferInState} from '../../state/marketplace/domain'
import {getTokens} from 'tamagui'
import React, {type ComponentProps, useMemo} from 'react'
import usePixelsFromBottomWhereTabsEnd from '../InsideRouter/utils'
import {FlashList} from '@shopify/flash-list'

export interface Props {
  readonly offers: OneOfferInState[]
  onRefresh?: () => void
  refreshing?: boolean
  ListHeaderComponent?: ComponentProps<typeof FlatList>['ListHeaderComponent']
}

function keyExtractor(offer: OneOfferInState): string {
  return offer.offerInfo.offerId
}

function renderItem({item}: {item: OneOfferInState}): JSX.Element {
  return <OffersListItem offer={item} />
}

function OffersList({
  onRefresh,
  refreshing,
  offers,
  ListHeaderComponent,
}: Props): JSX.Element {
  const bottomOffset = usePixelsFromBottomWhereTabsEnd()

  return (
    <FlashList
      ListHeaderComponent={ListHeaderComponent}
      estimatedItemSize={151}
      contentContainerStyle={useMemo(
        () => ({
          paddingHorizontal: getTokens().space[2].val,
          paddingBottom: bottomOffset + Number(getTokens().space[5].val),
        }),
        [bottomOffset]
      )}
      data={offers}
      onRefresh={onRefresh}
      refreshing={refreshing}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
    />
  )
}

export default OffersList

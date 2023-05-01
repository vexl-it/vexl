import OfferListItem from './OfferListItem'
import {FlatList, RefreshControl} from 'react-native'
import {type OneOfferInState} from '../../../../../state/marketplace/domain'
import {getTokens} from 'tamagui'
import usePixelsFromBottomWhereTabsEnd from '../../../utils'
import {type ComponentProps, useMemo} from 'react'

export interface Props {
  readonly offers: OneOfferInState[]
  onRefresh: () => void
  refreshing: boolean
  ListComponent?: ComponentProps<typeof FlatList>['ListHeaderComponent']
}

function keyExtractor(offer: OneOfferInState): string {
  return offer.offerInfo.offerId
}

function renderItem({item}: {item: OneOfferInState}): JSX.Element {
  return <OfferListItem offer={item} />
}

function OffersList({
  offers,
  onRefresh,
  refreshing,
  ListComponent,
}: Props): JSX.Element {
  const bottomOffset = usePixelsFromBottomWhereTabsEnd()

  return (
    <>
      <FlatList
        ListHeaderComponent={ListComponent}
        contentContainerStyle={useMemo(
          () => ({
            paddingBottom: bottomOffset + Number(getTokens().space[5].val),
          }),
          [bottomOffset]
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={getTokens().color.main.val}
          />
        }
        data={offers}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
    </>
  )
}

export default OffersList

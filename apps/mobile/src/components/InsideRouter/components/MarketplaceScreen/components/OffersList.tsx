import OfferListItem from './OfferListItem'
import {FlatList, RefreshControl} from 'react-native'
import {type OneOfferInState} from '../../../../../state/marketplace/domain'
import {getTokens} from 'tamagui'
import usePixelsFromBottomWhereTabsEnd from '../../../utils'

export interface Props {
  readonly offers: OneOfferInState[]
  onRefresh: () => void
  refreshing: boolean
}

function OffersList({offers, onRefresh, refreshing}: Props): JSX.Element {
  const tokens = getTokens()
  const bottomOffset = usePixelsFromBottomWhereTabsEnd()

  return (
    <>
      <FlatList
        contentContainerStyle={{
          marginLeft: tokens.space[2].val,
          marginRight: tokens.space[2].val,
          paddingBottom: bottomOffset + Number(tokens.space[5].val),
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.color.main.val}
          />
        }
        data={offers}
        renderItem={({item}) => <OfferListItem offer={item} />}
        keyExtractor={(offer) => offer.offerInfo.offerId}
      />
    </>
  )
}

export default OffersList

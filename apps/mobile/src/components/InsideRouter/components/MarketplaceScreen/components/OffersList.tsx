import OfferListItem from './OfferListItem'
import {FlatList, RefreshControl} from 'react-native'
import OffersListButtons from './OffersListButtons'
import {type OneOfferInState} from '../../../../../state/marketplace/domain'
import {getTokens, Stack} from 'tamagui'

export interface Props {
  readonly offers: OneOfferInState[]
  onRefresh: () => void
  refreshing: boolean
}

function OffersList({offers, onRefresh, refreshing}: Props): JSX.Element {
  const tokens = getTokens()
  return (
    <>
      <OffersListButtons />
      <Stack mx="$2">
        <FlatList
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
      </Stack>
    </>
  )
}

export default OffersList

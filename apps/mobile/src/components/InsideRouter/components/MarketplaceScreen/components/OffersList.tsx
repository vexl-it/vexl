import {type OfferInfo} from '@vexl-next/domain/dist/general/OfferInfo'
import {css} from '@emotion/native'
import OfferListItem from './OfferListItem'
import {FlatList, RefreshControl} from 'react-native'
import OffersListButtons from './OffersListButtons'
import {useTheme} from '@emotion/react'

export interface Props {
  readonly offers: OfferInfo[]
  onRefresh: () => void
  refreshing: boolean
}
function OffersList({offers, onRefresh, refreshing}: Props): JSX.Element {
  const theme = useTheme()
  return (
    <>
      <OffersListButtons />
      <FlatList
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.main}
          />
        }
        style={css`
          margin-left: 8px;
          margin-right: 8px;
        `}
        data={offers}
        renderItem={({item}) => <OfferListItem offer={item} />}
        keyExtractor={(offer) => offer.offerId}
      />
    </>
  )
}

export default OffersList

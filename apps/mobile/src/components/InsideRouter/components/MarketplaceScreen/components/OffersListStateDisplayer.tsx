import {
  useOfferState,
  useOffersWithType,
  useRefreshOffers,
} from '../../../../../state/offers'
import {useEffect} from 'react'
import ContainerWithTopBorderRadius from '../../ContainerWithTopBorderRadius'
import Text from '../../../../Text'
import OffersList from './OffersList'
import {type MarketplaceTabScreenProps} from '../../../../../navigationTypes'
import styled from '@emotion/native'
import {ActivityIndicator} from 'react-native'
import {useTheme} from '@emotion/react'
import EmptyListPlaceholder from './EmptyListPlaceholder'

const LoadingContainer = styled.View`
  flex: 1;
  padding-top: 20px;
  align-items: center;
`

type Props = MarketplaceTabScreenProps<'Buy' | 'Sell'>
function OffersListStateDisplayer({
  route: {
    params: {type},
  },
}: Props): JSX.Element {
  const theme = useTheme()
  const offersState = useOfferState()
  const refreshOffers = useRefreshOffers()
  const offers = useOffersWithType(type)

  useEffect(() => {
    refreshOffers()
  }, [refreshOffers])

  if (offers === null) {
    return (
      <LoadingContainer>
        <ActivityIndicator color={theme.colors.main} size="large" />
      </LoadingContainer>
    )
  }

  if (!offers && offersState.state === 'fail') {
    return <Text>Failed to load offers</Text> // TODO
  }

  return (
    <ContainerWithTopBorderRadius>
      {offers.length === 0 ? (
        <EmptyListPlaceholder />
      ) : (
        <OffersList
          offers={offers ?? []}
          onRefresh={refreshOffers}
          refreshing={offersState.state === 'loading'}
        />
      )}
    </ContainerWithTopBorderRadius>
  )
}

export default OffersListStateDisplayer

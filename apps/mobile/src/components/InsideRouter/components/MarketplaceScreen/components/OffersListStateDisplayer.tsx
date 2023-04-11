import {useEffect, useMemo} from 'react'
import ContainerWithTopBorderRadius from '../../ContainerWithTopBorderRadius'
import {type MarketplaceTabScreenProps} from '../../../../../navigationTypes'
import styled from '@emotion/native'
import {ActivityIndicator, Alert} from 'react-native'
import {useTheme} from '@emotion/react'
import {
  useAreOffersLoading,
  useFilteredOffers,
  useOffersLoadingError,
  useTriggerOffersRefresh,
} from '../../../../../state/marketplace'
import EmptyListPlaceholder from './EmptyListPlaceholder'
import OffersList from './OffersList'

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
  const loading = useAreOffersLoading()
  const error = useOffersLoadingError()
  const refreshOffers = useTriggerOffersRefresh()
  const offers = useFilteredOffers(useMemo(() => ({offerType: type}), [type]))

  useEffect(() => {
    if (error._tag === 'Some') {
      Alert.alert('error while refreshing offers')
    }
  }, [error])

  if (offers.length === 0 && loading) {
    return (
      <LoadingContainer>
        <ActivityIndicator color={theme.colors.main} size="large" />
      </LoadingContainer>
    )
  }

  // TODO handle errors

  return (
    <ContainerWithTopBorderRadius>
      {offers.length === 0 ? (
        <EmptyListPlaceholder />
      ) : (
        <OffersList
          offers={offers}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onRefresh={refreshOffers}
          refreshing={loading}
        />
      )}
    </ContainerWithTopBorderRadius>
  )
}

export default OffersListStateDisplayer

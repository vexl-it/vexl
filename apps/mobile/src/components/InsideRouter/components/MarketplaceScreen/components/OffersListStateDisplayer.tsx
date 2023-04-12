import {useEffect, useMemo} from 'react'
import ContainerWithTopBorderRadius from '../../ContainerWithTopBorderRadius'
import OffersList from './OffersList'
import {type MarketplaceTabScreenProps} from '../../../../../navigationTypes'
import {ActivityIndicator, Alert} from 'react-native'
import {
  useAreOffersLoading,
  useFilteredOffers,
  useOffersLoadingError,
  useTriggerOffersRefresh,
} from '../../../../../state/marketplace'
import EmptyListPlaceholder from './EmptyListPlaceholder'
import {getTokens, Stack} from 'tamagui'

type Props = MarketplaceTabScreenProps<'Buy' | 'Sell'>

function OffersListStateDisplayer({
  route: {
    params: {type},
  },
}: Props): JSX.Element {
  const tokens = getTokens()
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
      <Stack f={1} ai="center" pt="$5">
        <ActivityIndicator color={tokens.color.main.val} size="large" />
      </Stack>
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

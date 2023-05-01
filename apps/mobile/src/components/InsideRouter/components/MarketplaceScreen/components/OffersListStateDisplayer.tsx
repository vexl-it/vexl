import {useMemo} from 'react'
import ContainerWithTopBorderRadius from '../../ContainerWithTopBorderRadius'
import OffersList from './OffersList'
import {type MarketplaceTabScreenProps} from '../../../../../navigationTypes'
import {ActivityIndicator} from 'react-native'
import {
  useAreOffersLoading,
  useFilteredOffers,
  useOffersLoadingError,
  useTriggerOffersRefresh,
} from '../../../../../state/marketplace'
import EmptyListPlaceholder from './EmptyListPlaceholder'
import {getTokens, Stack} from 'tamagui'
import OffersListButtons from './OffersListButtons'
import {useNavigation} from '@react-navigation/native'
import ErrorListHeader from '../../../../ErrorListHeader'
import {isNone} from 'fp-ts/Option'

type Props = MarketplaceTabScreenProps<'Buy' | 'Sell'>

function OffersListStateDisplayer({
  route: {
    params: {type},
  },
}: Props): JSX.Element {
  const navigation = useNavigation()
  const tokens = getTokens()
  const loading = useAreOffersLoading()
  const error = useOffersLoadingError()
  const refreshOffers = useTriggerOffersRefresh()
  const offers = useFilteredOffers(useMemo(() => ({offerType: type}), [type]))

  const renderListHeader = useMemo(() => {
    if (isNone(error)) return null

    return <ErrorListHeader mt={'$6'} error={error.value} />
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
      <OffersListButtons
        onAddPress={() => {
          navigation.navigate('CreateOffer')
        }}
      />
      {offers.length === 0 ? (
        <EmptyListPlaceholder />
      ) : (
        <OffersList
          ListComponent={renderListHeader}
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

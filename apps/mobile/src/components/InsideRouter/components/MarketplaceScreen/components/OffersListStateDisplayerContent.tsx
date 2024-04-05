import {isNone} from 'fp-ts/Option'
import {useAtomValue, useSetAtom} from 'jotai'
import {useMemo} from 'react'
import {ActivityIndicator} from 'react-native'
import {Stack, getTokens} from 'tamagui'
import {
  triggerOffersRefreshAtom,
  useAreOffersLoading,
  useOffersLoadingError,
} from '../../../../../state/marketplace'
import {
  filteredOffersBuyAtomsAtom,
  filteredOffersSellAtomsAtom,
} from '../../../../../state/marketplace/atoms/filteredOffers'
import ErrorListHeader from '../../../../ErrorListHeader'
import OffersList from '../../../../OffersList'
import ReencryptOffersSuggestion from '../../../../ReencryptOffersSuggestion'
import ContainerWithTopBorderRadius from '../../ContainerWithTopBorderRadius'
import AddListingTypeToOffersSuggestion from './AddListingTypeToOffersSuggestion'
import EmptyListPlaceholder from './EmptyListPlaceholder'
import ImportNewContactsSuggestion from './ImportNewContactsSuggestion'
import OffersListButtons from './OffersListButtons'
import TotalOffersCount from './TotalOffersCount'

interface Props {
  type: 'BUY' | 'SELL'
}

function OffersListStateDisplayerContent({type}: Props): JSX.Element {
  const tokens = getTokens()
  const loading = useAreOffersLoading()
  const error = useOffersLoadingError()
  const refreshOffers = useSetAtom(triggerOffersRefreshAtom)

  const offersAtoms = useAtomValue(
    type === 'SELL' ? filteredOffersSellAtomsAtom : filteredOffersBuyAtomsAtom
  )

  const ListHeaderComponent = useMemo(() => {
    if (isNone(error))
      return (
        <Stack>
          <TotalOffersCount
            filteredOffersCount={offersAtoms.length}
            offerType={type}
          />
          <ReencryptOffersSuggestion mt="$5" px="$0" />
          <ImportNewContactsSuggestion mt="$5" px="$0" />
          <AddListingTypeToOffersSuggestion mt="$5" px="$0" />
        </Stack>
      )

    return <ErrorListHeader mt="$6" error={error.value} />
  }, [error, offersAtoms.length, type])

  if (offersAtoms.length === 0 && loading) {
    return (
      <Stack f={1} ai="center" jc="center" pt="$5">
        <ActivityIndicator color={tokens.color.main.val} size="large" />
      </Stack>
    )
  }

  return (
    <ContainerWithTopBorderRadius>
      <OffersListButtons marketplaceEmpty={offersAtoms.length === 0} />
      {offersAtoms.length === 0 ? (
        <EmptyListPlaceholder refreshing={loading} onRefresh={refreshOffers} />
      ) : (
        <Stack f={1} mx="$2">
          <OffersList
            ListHeaderComponent={ListHeaderComponent}
            offersAtoms={offersAtoms}
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onRefresh={refreshOffers}
            refreshing={loading}
          />
        </Stack>
      )}
    </ContainerWithTopBorderRadius>
  )
}

export default OffersListStateDisplayerContent

import {isNone} from 'fp-ts/Option'
import {useAtomValue, useSetAtom} from 'jotai'
import {useMemo} from 'react'
import {ActivityIndicator} from 'react-native'
import {Stack, XStack, getTokens} from 'tamagui'
import {
  triggerOffersRefreshAtom,
  useAreOffersLoading,
  useOffersLoadingError,
} from '../../../../../state/marketplace'
import {baseFilterAtom} from '../../../../../state/marketplace/atoms/filterAtoms'
import {filteredOffersIncludingLocationFilterAtomsAtom} from '../../../../../state/marketplace/atoms/filteredOffers'
import {refocusMapActionAtom} from '../../../../../state/marketplace/atoms/map/focusedOffer'
import ErrorListHeader from '../../../../ErrorListHeader'
import MarketplaceMapContainer from '../../../../MarketplaceMapContainer'
import OffersList from '../../../../OffersList'
import ReencryptOffersSuggestion from '../../../../ReencryptOffersSuggestion'
import ContainerWithTopBorderRadius from '../../ContainerWithTopBorderRadius'
import AddListingTypeToOffersSuggestion from './AddListingTypeToOffersSuggestion'
import BaseFilterDropdown from './BaseFilterDropdown'
import EmptyListPlaceholder from './EmptyListPlaceholder'
import FiatSatsDropdown from './FiatSatsDropdown'
import FilterButton from './FilterButton'
import ImportNewContactsSuggestion from './ImportNewContactsSuggestion'
import SearchOffers from './SearchOffers'
import TotalOffersCount from './TotalOffersCount'

function OffersListStateDisplayerContent(): JSX.Element {
  const tokens = getTokens()
  const loading = useAreOffersLoading()
  const error = useOffersLoadingError()
  const refreshOffers = useSetAtom(triggerOffersRefreshAtom)
  const refocusMap = useSetAtom(refocusMapActionAtom)
  const baseFilter = useAtomValue(baseFilterAtom)

  const offersAtoms = useAtomValue(
    filteredOffersIncludingLocationFilterAtomsAtom
  )

  const ListHeaderComponent = useMemo(() => {
    if (isNone(error))
      return (
        <Stack px="$1">
          <XStack f={1} ai="center" jc="space-between" pb="$2">
            <Stack f={1}>
              <TotalOffersCount filteredOffersCount={offersAtoms.length} />
            </Stack>
            {baseFilter !== 'BTC_TO_CASH' &&
              baseFilter !== 'CASH_TO_BTC' &&
              baseFilter !== 'ALL_SELLING_BTC' &&
              baseFilter !== 'ALL_BUYING_BTC' && (
                <Stack f={1}>
                  <FiatSatsDropdown />
                </Stack>
              )}
          </XStack>
          <ReencryptOffersSuggestion mb="$6" />
          <ImportNewContactsSuggestion mb="$6" />
          <AddListingTypeToOffersSuggestion mb="$6" />
        </Stack>
      )

    return <ErrorListHeader mt="$6" error={error.value} />
  }, [baseFilter, error, offersAtoms.length])

  if (offersAtoms.length === 0 && loading) {
    return (
      <Stack f={1} ai="center" jc="center" pt="$5">
        <ActivityIndicator color={tokens.color.main.val} size="large" />
      </Stack>
    )
  }

  return (
    <ContainerWithTopBorderRadius testID="@marketplaceScreen">
      <Stack space="$4">
        <Stack px="$2">
          <BaseFilterDropdown
            postSelectActions={() => {
              refocusMap({focusAllOffers: false})
            }}
          />
        </Stack>
        <XStack space="$2" pb="$2">
          <SearchOffers
            postSearchActions={() => {
              refocusMap({focusAllOffers: false})
            }}
          />
          <FilterButton />
        </XStack>
      </Stack>
      <MarketplaceMapContainer />
      {offersAtoms.length === 0 ? (
        <EmptyListPlaceholder refreshing={loading} onRefresh={refreshOffers} />
      ) : (
        <Stack f={1}>
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

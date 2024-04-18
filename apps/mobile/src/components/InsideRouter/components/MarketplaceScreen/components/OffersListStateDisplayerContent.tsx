import {isNone} from 'fp-ts/Option'
import {useAtomValue, useSetAtom} from 'jotai'
import {useMemo} from 'react'
import {ActivityIndicator} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import {Stack, XStack, getTokens} from 'tamagui'
import {
  triggerOffersRefreshAtom,
  useAreOffersLoading,
  useOffersLoadingError,
} from '../../../../../state/marketplace'
import {baseFilterAtom} from '../../../../../state/marketplace/atoms/filterAtoms'
import {
  btcToCashOffersIncludingLocationAtomsAtom,
  btcToProductOffersIncludingLocationAtomsAtom,
  cashToBtcOffersIncludingLocationAtomsAtom,
  productToBtcOffersIncludingLocationAtomsAtom,
  sthElseOffersIncludingLocationAtomsAtom,
} from '../../../../../state/marketplace/atoms/filteredOffers'
import marketplaceLayoutModeAtom from '../../../../../state/marketplace/atoms/map/marketplaceLayoutModeAtom'
import ErrorListHeader from '../../../../ErrorListHeader'
import OffersList from '../../../../OffersList'
import ReencryptOffersSuggestion from '../../../../ReencryptOffersSuggestion'
import AddListingTypeToOffersSuggestion from './AddListingTypeToOffersSuggestion'
import BaseFilterDropdown from './BaseFilterDropdown'
import EmptyListPlaceholder from './EmptyListPlaceholder'
import FilterButton from './FilterButton'
import ImportNewContactsSuggestion from './ImportNewContactsSuggestion'
import SearchOffers from './SearchOffers'
import TotalOffersCount from './TotalOffersCount'

function OffersListStateDisplayerContent(): JSX.Element {
  const tokens = getTokens()
  const loading = useAreOffersLoading()
  const error = useOffersLoadingError()
  const refreshOffers = useSetAtom(triggerOffersRefreshAtom)
  const marketplaceLayoutMode = useAtomValue(marketplaceLayoutModeAtom)
  const baseFilter = useAtomValue(baseFilterAtom)

  const offersAtoms = useAtomValue(
    baseFilter === 'BTC_TO_CASH'
      ? btcToCashOffersIncludingLocationAtomsAtom
      : baseFilter === 'CASH_TO_BTC'
      ? cashToBtcOffersIncludingLocationAtomsAtom
      : baseFilter === 'BTC_TO_PRODUCT'
      ? btcToProductOffersIncludingLocationAtomsAtom
      : baseFilter === 'PRODUCT_TO_BTC'
      ? productToBtcOffersIncludingLocationAtomsAtom
      : sthElseOffersIncludingLocationAtomsAtom
  )

  const ListHeaderComponent = useMemo(() => {
    if (isNone(error))
      return (
        <Stack>
          <TotalOffersCount filteredOffersCount={offersAtoms.length} />
          <ReencryptOffersSuggestion mt="$5" px="$0" />
          <ImportNewContactsSuggestion mt="$5" px="$0" />
          <AddListingTypeToOffersSuggestion mt="$5" px="$0" />
        </Stack>
      )

    return <ErrorListHeader mt="$6" error={error.value} />
  }, [error, offersAtoms.length])

  if (offersAtoms.length === 0 && loading) {
    return (
      <Stack f={1} ai="center" jc="center" pt="$5">
        <ActivityIndicator color={tokens.color.main.val} size="large" />
      </Stack>
    )
  }

  return (
    <Stack f={1} bc="$black" px="$2">
      <SafeAreaView
        style={{flex: 1}}
        edges={marketplaceLayoutMode === 'list' ? ['top', 'right', 'left'] : []}
      >
        {marketplaceLayoutMode === 'list' && (
          <Stack space="$2">
            <BaseFilterDropdown />
            <XStack space="$2">
              <SearchOffers />
              <FilterButton />
            </XStack>
          </Stack>
        )}
        {offersAtoms.length === 0 ? (
          <>
            <EmptyListPlaceholder
              refreshing={loading}
              onRefresh={refreshOffers}
            />
          </>
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
      </SafeAreaView>
    </Stack>
  )
}

export default OffersListStateDisplayerContent

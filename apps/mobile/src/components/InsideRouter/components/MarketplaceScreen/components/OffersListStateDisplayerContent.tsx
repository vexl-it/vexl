import {useMemo} from 'react'
import {isNone} from 'fp-ts/Option'
import ErrorListHeader from '../../../../ErrorListHeader'
import {getTokens, Stack} from 'tamagui'
import {ActivityIndicator} from 'react-native'
import ContainerWithTopBorderRadius from '../../ContainerWithTopBorderRadius'
import OffersListButtons from './OffersListButtons'
import EmptyListPlaceholder from './EmptyListPlaceholder'
import OffersList from '../../../../OffersList'
import {
  triggerOffersRefreshAtom,
  useAreOffersLoading,
  useOffersLoadingError,
} from '../../../../../state/marketplace'
import {useAtomValue, useSetAtom} from 'jotai'
import {offersAtomWithFilter} from '../../../../../state/marketplace/atom'
import {splitAtom} from 'jotai/utils'
import TotalOffersCount from './TotalOffersCount'
import {offersFilterFromStorageAtom} from '../../../../../state/offersFilter'
import ImportNewContactsSuggestion from './ImportNewContactsSuggestion'

interface Props {
  type: 'BUY' | 'SELL'
  navigateToCreateOffer: () => void
  navigateToFilterOffers: () => void
  navigateToMyOffers: () => void
}

function OffersListStateDisplayerContent({
  navigateToCreateOffer,
  navigateToFilterOffers,
  navigateToMyOffers,
  type,
}: Props): JSX.Element {
  const tokens = getTokens()
  const loading = useAreOffersLoading()
  const error = useOffersLoadingError()
  const refreshOffers = useSetAtom(triggerOffersRefreshAtom)
  const filter = useAtomValue(offersFilterFromStorageAtom)
  const basicFilter = useMemo(
    () => ({
      offerType: type,
    }),
    [type]
  )

  const offersAtoms = useAtomValue(
    useMemo(
      () => splitAtom(offersAtomWithFilter({...filter, ...basicFilter})),
      [filter, basicFilter]
    )
  )

  const renderListHeader = useMemo(() => {
    if (isNone(error))
      return (
        <Stack>
          <TotalOffersCount
            filteredOffersCount={offersAtoms.length}
            offerType={type}
          />
          <ImportNewContactsSuggestion px={'$0'} />
        </Stack>
      )

    return <ErrorListHeader mt={'$6'} error={error.value} />
  }, [error, offersAtoms.length, type])

  if (offersAtoms.length === 0 && loading) {
    return (
      <Stack f={1} ai={'center'} jc={'center'} pt="$5">
        <ActivityIndicator color={tokens.color.main.val} size="large" />
      </Stack>
    )
  }

  return (
    <ContainerWithTopBorderRadius>
      <OffersListButtons
        marketplaceEmpty={offersAtoms.length === 0}
        onAddPress={navigateToCreateOffer}
        onFilterOffersPress={navigateToFilterOffers}
        onMyOffersPress={navigateToMyOffers}
      />
      {offersAtoms.length === 0 ? (
        <EmptyListPlaceholder />
      ) : (
        <OffersList
          ListHeaderComponent={renderListHeader}
          offersAtoms={offersAtoms}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onRefresh={refreshOffers}
          refreshing={loading}
        />
      )}
    </ContainerWithTopBorderRadius>
  )
}

export default OffersListStateDisplayerContent

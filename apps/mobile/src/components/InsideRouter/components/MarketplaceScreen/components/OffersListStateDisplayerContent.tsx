import {useMemo} from 'react'
import {isNone} from 'fp-ts/Option'
import ErrorListHeader from '../../../../ErrorListHeader'
import {getTokens, Stack, Text} from 'tamagui'
import {ActivityIndicator} from 'react-native'
import ContainerWithTopBorderRadius from '../../ContainerWithTopBorderRadius'
import OffersListButtons from './OffersListButtons'
import EmptyListPlaceholder from './EmptyListPlaceholder'
import OffersList from '../../../../OffersList'
import {
  useAreOffersLoading,
  useOffersLoadingError,
  useTriggerOffersRefresh,
} from '../../../../../state/marketplace'
import {useAtomValue} from 'jotai'
import {offersAtomWithFilter} from '../../../../../state/marketplace/atom'
import {splitAtom} from 'jotai/utils'
import {offersFilterAtom} from '../../../../FilterOffersScreen/atom'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

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
  const {t} = useTranslation()
  const tokens = getTokens()
  const loading = useAreOffersLoading()
  const error = useOffersLoadingError()
  const refreshOffers = useTriggerOffersRefresh()
  const filter = useAtomValue(offersFilterAtom)
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
    if (isNone(error)) return null

    return <ErrorListHeader mt={'$6'} error={error.value} />
  }, [error])

  if (offersAtoms.length === 0 && loading) {
    return (
      <Stack f={1} ai="center" pt="$5">
        <ActivityIndicator color={tokens.color.main.val} size="large" />
      </Stack>
    )
  }

  return (
    <ContainerWithTopBorderRadius>
      <OffersListButtons
        onAddPress={navigateToCreateOffer}
        onFilterOffersPress={navigateToFilterOffers}
        onMyOffersPress={navigateToMyOffers}
      />
      <Stack als={'flex-end'} my={'$2'} mx="$2">
        <Text ff={'$body600'} color={'$main'}>
          {t('offer.totalOffers', {count: offersAtoms.length})}
        </Text>
      </Stack>
      {offersAtoms.length === 0 ? (
        <Stack pos={'absolute'} t={0} b={0} l={0} r={0} zIndex={-1}>
          <EmptyListPlaceholder />
        </Stack>
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

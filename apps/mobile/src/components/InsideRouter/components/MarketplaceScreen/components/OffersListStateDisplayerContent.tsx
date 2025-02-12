import {useNavigation} from '@react-navigation/native'
import {isNone} from 'fp-ts/Option'
import {useAtomValue, useSetAtom} from 'jotai'
import {useMemo} from 'react'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, XStack, getTokens} from 'tamagui'
import {
  triggerOffersRefreshAtom,
  useAreOffersLoading,
  useOffersLoadingError,
} from '../../../../../state/marketplace'
import {baseFilterAtom} from '../../../../../state/marketplace/atoms/filterAtoms'
import {filteredOffersIncludingLocationFilterAtomsAtom} from '../../../../../state/marketplace/atoms/filteredOffers'
import {refocusMapActionAtom} from '../../../../../state/marketplace/atoms/map/focusedOffer'
import {joinVexlClubsSuggestionVisibleAtom} from '../../../../../state/marketplace/atoms/offerSuggestionVisible'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import ErrorListHeader from '../../../../ErrorListHeader'
import VexlActivityIndicator from '../../../../LoadingOverlayProvider/VexlActivityIndicator'
import {MAP_SIZE} from '../../../../MarketplaceMap'
import MarketplaceMapContainer from '../../../../MarketplaceMapContainer'
import MarketplaceSuggestion from '../../../../MarketplaceSuggestion'
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

function ListFooterComponent(): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()

  return (
    <Stack mt="$4">
      <MarketplaceSuggestion
        buttonText={t('suggestion.whatAreClubs')}
        onButtonPress={() => {
          navigation.navigate('Faqs', {
            pageType: 'WHAT_ARE_VEXL_CLUBS',
          })
        }}
        text={t('suggestion.lookingForMoreoffers')}
        visibleStateAtom={joinVexlClubsSuggestionVisibleAtom}
      />
    </Stack>
  )
}

function OffersListStateDisplayerContent(): JSX.Element {
  const tokens = getTokens()
  const insets = useSafeAreaInsets()
  const loading = useAreOffersLoading()
  const error = useOffersLoadingError()
  const refreshOffers = useSetAtom(triggerOffersRefreshAtom)
  const refocusMap = useSetAtom(refocusMapActionAtom)
  const baseFilter = useAtomValue(baseFilterAtom)

  const scrollY = useSharedValue(0)
  const handleScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y
  })

  const opacityAnim = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [0, MAP_SIZE - insets.top / 0.9],
        [1, 0],
        Extrapolation.CLAMP
      ),
    }
  })

  const scaleAnim = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(scrollY.value, [-50, 0], [1.3, 1], {
            extrapolateLeft: 'extend',
            extrapolateRight: 'clamp',
          }),
        },
      ],
    }
  })

  const offersAtoms = useAtomValue(
    filteredOffersIncludingLocationFilterAtomsAtom
  )

  const ListHeaderComponent = useMemo(() => {
    if (isNone(error))
      return (
        <Stack>
          <Animated.View style={[opacityAnim, scaleAnim]}>
            <MarketplaceMapContainer />
          </Animated.View>
          {offersAtoms.length > 0 ? (
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
          ) : (
            <EmptyListPlaceholder
              refreshing={loading}
              onRefresh={refreshOffers}
            />
          )}
        </Stack>
      )

    return <ErrorListHeader mt="$6" error={error.value} />
  }, [
    baseFilter,
    error,
    loading,
    offersAtoms.length,
    opacityAnim,
    refreshOffers,
    scaleAnim,
  ])

  if (offersAtoms.length === 0 && loading) {
    return (
      <Stack f={1} ai="center" jc="center" pt="$5">
        <VexlActivityIndicator bc={tokens.color.main.val} size="large" />
      </Stack>
    )
  }

  return (
    <ContainerWithTopBorderRadius testID="@marketplaceScreen">
      <Stack gap="$4">
        <Stack px="$2">
          <BaseFilterDropdown
            postSelectActions={() => {
              refocusMap({focusAllOffers: false})
            }}
          />
        </Stack>
        <XStack gap="$2" pb="$2">
          <SearchOffers
            postSearchActions={() => {
              refocusMap({focusAllOffers: false})
            }}
          />
          <FilterButton />
        </XStack>
      </Stack>
      <Stack f={1}>
        <OffersList
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={ListFooterComponent}
          offersAtoms={offersAtoms}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onRefresh={refreshOffers}
          refreshing={loading}
          onScroll={handleScroll}
        />
      </Stack>
    </ContainerWithTopBorderRadius>
  )
}

export default OffersListStateDisplayerContent

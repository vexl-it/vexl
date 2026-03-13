import {isNone} from 'fp-ts/Option'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import Animated, {
  Extrapolation,
  type SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, XStack, YStack} from 'tamagui'
import {useOffersLoadingError} from '../../../../../state/marketplace'
import {baseFilterAtom} from '../../../../../state/marketplace/atoms/filterAtoms'
import {filteredOffersIncludingLocationFilterAtomsAtom} from '../../../../../state/marketplace/atoms/filteredOffers'
import {refocusMapActionAtom} from '../../../../../state/marketplace/atoms/map/focusedOffer'
import EnableBackgroundFetchSuggestion from '../../../../EnableBackgroundFetchSuggestion'
import ErrorListHeader from '../../../../ErrorListHeader'
import {MAP_SIZE} from '../../../../MarketplaceMap'
import MarketplaceMapContainer from '../../../../MarketplaceMapContainer'
import ReencryptOffersSuggestion from '../../../../ReencryptOffersSuggestion'
import AddListingTypeToOffersSuggestion from './AddListingTypeToOffersSuggestion'
import BaseFilterDropdown from './BaseFilterDropdown'
import CheckUpdatedPrivacyPolicySuggestion from './CheckUpdatedPrivacyPolicySuggestion'
import EmptyListPlaceholder from './EmptyListPlaceholder'
import EnableNewOffersNotificationSuggestion from './EnableNewOffersNotificationSuggestion'
import FiatSatsDropdown from './FiatSatsDropdown'
import FilterButton from './FilterButton'
import ImportNewContactsSuggestion from './ImportNewContactsSuggestion'
import RemovedClubsSuggestion from './RemovedClubsSuggestion'
import SearchOffers from './SearchOffers'
import TotalOffersCount from './TotalOffersCount'
import VexlNewsSuggestions from './VexlNewsSuggestions'

interface Props {
  readonly scrollY: SharedValue<number>
}

function AllOffersListHeader({scrollY}: Props): React.ReactElement {
  const insets = useSafeAreaInsets()
  const error = useOffersLoadingError()
  const baseFilter = useAtomValue(baseFilterAtom)
  const offersAtoms = useAtomValue(
    filteredOffersIncludingLocationFilterAtomsAtom
  )
  const refocusMap = useSetAtom(refocusMapActionAtom)

  const opacityAnim = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, MAP_SIZE - insets.top / 0.9],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }))

  const scaleAnim = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(scrollY.value, [-50, 0], [1.3, 1], {
          extrapolateLeft: 'extend',
          extrapolateRight: 'clamp',
        }),
      },
    ],
  }))

  const topControls = (
    <Stack gap="$4" px="$2" pb="$4">
      <BaseFilterDropdown
        postSelectActions={() => {
          refocusMap({focusAllOffers: false})
        }}
      />
      <XStack gap="$2" pb="$2">
        <SearchOffers
          postSearchActions={() => {
            refocusMap({focusAllOffers: false})
          }}
        />
        <FilterButton />
      </XStack>
    </Stack>
  )

  if (isNone(error))
    return (
      <Stack>
        {topControls}
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
            <YStack gap="$6" mb="$6">
              <CheckUpdatedPrivacyPolicySuggestion />
              <EnableBackgroundFetchSuggestion />
              <ReencryptOffersSuggestion />
              <VexlNewsSuggestions />
              <RemovedClubsSuggestion />
              <ImportNewContactsSuggestion />
              <AddListingTypeToOffersSuggestion />
            </YStack>
          </Stack>
        ) : (
          <YStack gap="$6" mb="$6">
            <CheckUpdatedPrivacyPolicySuggestion />
            <EnableBackgroundFetchSuggestion />
            <ReencryptOffersSuggestion />
            <VexlNewsSuggestions />
            <RemovedClubsSuggestion />
            <EnableNewOffersNotificationSuggestion />
            <EmptyListPlaceholder />
          </YStack>
        )}
      </Stack>
    )

  return (
    <Stack>
      {topControls}
      <ErrorListHeader mt="$6" error={error.value} />
    </Stack>
  )
}

export default AllOffersListHeader

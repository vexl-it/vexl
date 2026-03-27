import {Map} from '@vexl-next/ui'
import {isNone} from 'fp-ts/Option'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, useTheme, XStack} from 'tamagui'
import {useOffersLoadingError} from '../../../../../state/marketplace'
import {refocusMapActionAtom} from '../../../../../state/marketplace/atoms/map/focusedOffer'
import {areThereOffersToSeeInMarketplaceWithoutFiltersAtom} from '../../../../../state/marketplace/atoms/offersToSeeInMarketplace'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import ErrorListHeader from '../../../../ErrorListHeader'
import {MAP_SIZE} from '../../../../MarketplaceMap'
import MarketplaceMapContainer from '../../../../MarketplaceMapContainer'
import EmptyList from './EmptyList'
import FilterButton from './FilterButton'
import FilterTagBar from './FilterTagBar'
import MarketplaceInlineButton from './MarketplaceInlineButton'
import SearchOffers from './SearchOffers'
import TotalOffersCount from './TotalOffersCount'

interface Props {
  readonly filteredOffersCount: number
  readonly scrollY: SharedValue<number>
}

function AllOffersListHeader({
  filteredOffersCount,
  scrollY,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const error = useOffersLoadingError()
  const areThereOffersToSeeInMarketplaceWithoutFilters = useAtomValue(
    areThereOffersToSeeInMarketplaceWithoutFiltersAtom
  )
  const refocusMap = useSetAtom(refocusMapActionAtom)

  const handleRefocusMap = useCallback(() => {
    refocusMap({focusAllOffers: false})
  }, [refocusMap])

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
    <Stack gap="$4" pb="$7">
      <FilterTagBar postSelectActions={handleRefocusMap} />
      <XStack gap="$3" paddingHorizontal="$5">
        <SearchOffers postSearchActions={handleRefocusMap} />
        <FilterButton />
      </XStack>
    </Stack>
  )

  if (isNone(error))
    return (
      <Stack paddingTop="$7" paddingBottom="$5">
        {!!areThereOffersToSeeInMarketplaceWithoutFilters && topControls}
        <Animated.View style={[opacityAnim, scaleAnim]}>
          <MarketplaceMapContainer />
        </Animated.View>
        {areThereOffersToSeeInMarketplaceWithoutFilters ? (
          <Stack paddingHorizontal="$5">
            <XStack ai="center" jc="space-between">
              <TotalOffersCount filteredOffersCount={filteredOffersCount} />
              <MarketplaceInlineButton
                icon={
                  <Map size={18} color={theme.accentHighlightPrimary.val} />
                }
                label={t('marketplace.showOnMap')}
                color={theme.accentHighlightPrimary.val}
                onPress={() => {}}
              />
            </XStack>
            {/* <YStack gap="$6">
              <CheckUpdatedPrivacyPolicySuggestion />
              <EnableBackgroundFetchSuggestion />
              <ReencryptOffersSuggestion />
              <VexlNewsSuggestions />
              <RemovedClubsSuggestion />
              <ImportNewContactsSuggestion />
              <AddListingTypeToOffersSuggestion />
            </YStack> */}
          </Stack>
        ) : (
          <EmptyList />
          // <YStack gap="$6" mb="$6">
          //   <CheckUpdatedPrivacyPolicySuggestion />
          //   <EnableBackgroundFetchSuggestion />
          //   <ReencryptOffersSuggestion />
          //   <VexlNewsSuggestions />
          //   <RemovedClubsSuggestion />
          //   <EnableNewOffersNotificationSuggestion />
          //   <EmptyListPlaceholder />
          // </YStack>
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

import {useNavigation} from '@react-navigation/native'
import {Map} from '@vexl-next/ui'
import {isNone} from 'fp-ts/Option'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Stack, useTheme, XStack} from 'tamagui'
import {useOffersLoadingError} from '../../../../../state/marketplace'
import {refocusMapActionAtom} from '../../../../../state/marketplace/atoms/map/focusedOffer'
import {areThereOffersToSeeInMarketplaceWithoutFiltersAtom} from '../../../../../state/marketplace/atoms/offersToSeeInMarketplace'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import ErrorListHeader from '../../../../ErrorListHeader'
import EmptyList from './EmptyList'
import FilterButton from './FilterButton'
import FilterTagBar from './FilterTagBar'
import MarketplaceInlineButton from './MarketplaceInlineButton'
import SearchOffers from './SearchOffers'
import TotalOffersCount from './TotalOffersCount'

interface Props {
  readonly filteredOffersCount: number
  readonly onFilterChange: () => void
}

function AllOffersListHeader({
  filteredOffersCount,
  onFilterChange,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const navigation = useNavigation()
  const error = useOffersLoadingError()
  const areThereOffersToSeeInMarketplaceWithoutFilters = useAtomValue(
    areThereOffersToSeeInMarketplaceWithoutFiltersAtom
  )
  const refocusMap = useSetAtom(refocusMapActionAtom)

  const handleFilterChange = useCallback(() => {
    onFilterChange()
    refocusMap({focusAllOffers: false})
  }, [onFilterChange, refocusMap])

  const handleShowOnMap = useCallback(() => {
    navigation.navigate('MapView')
  }, [navigation])

  const topControls = (
    <Stack gap="$4" pb="$7">
      <FilterTagBar postSelectActions={handleFilterChange} />
      <XStack gap="$3" paddingHorizontal="$5">
        <SearchOffers postSearchActions={handleFilterChange} />
        <FilterButton />
      </XStack>
    </Stack>
  )

  if (isNone(error))
    return (
      <Stack paddingTop="$7" paddingBottom="$5">
        {!!areThereOffersToSeeInMarketplaceWithoutFilters && topControls}
        {areThereOffersToSeeInMarketplaceWithoutFilters ? (
          <Stack paddingHorizontal="$5">
            <XStack ai="center" jc="space-between">
              <TotalOffersCount filteredOffersCount={filteredOffersCount} />
              <MarketplaceInlineButton
                icon={
                  <Map size={18} color={theme.accentHighlightPrimary.get()} />
                }
                label={t('marketplace.showOnMap')}
                color={theme.accentHighlightPrimary.get()}
                onPress={handleShowOnMap}
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

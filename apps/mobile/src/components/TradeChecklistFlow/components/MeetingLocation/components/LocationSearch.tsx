import {type MeetingLocationData} from '@vexl-next/domain/src/general/tradeChecklist'
import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {
  ChevronLeft,
  EmptyState,
  IconButton,
  LocationSuggestionRow,
  NavigationBar,
  PinGeolocation,
  SearchBar,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {ScopeProvider, useMolecule} from 'bunshi/dist/react'
import {type Atom, atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect, useMemo} from 'react'
import {FlatList} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {getTokens} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../../navigationTypes'
import atomKeyExtractor from '../../../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {
  LocationSearchMolecule,
  LocationSearchScope,
  newLocationSessionId,
} from '../../../../LocationSearch/molecule'

type Props = TradeChecklistStackScreenProps<'LocationSearch'>
type SearchScreenContentProps = Pick<Props, 'navigation'>

function locationSuggestionToMeetingLocationData(
  locationData: LocationSuggestion
): MeetingLocationData {
  return {
    placeId: locationData.userData.placeId,
    latitude: locationData.userData.latitude,
    longitude: locationData.userData.longitude,
    viewport: locationData.userData.viewport,
    address: locationData.userData.suggestSecondRow
      ? `${locationData.userData.suggestFirstRow}, ${locationData.userData.suggestSecondRow}`
      : locationData.userData.suggestFirstRow,
  }
}

function ResultItem({
  atom,
  onPress,
}: {
  atom: Atom<LocationSuggestion>
  onPress: (locationData: LocationSuggestion) => void
}): React.ReactElement {
  const locationData = useAtomValue(atom)

  return (
    <LocationSuggestionRow
      title={locationData.userData.suggestFirstRow}
      subtitle={locationData.userData.suggestSecondRow}
      onPress={() => {
        onPress(locationData)
      }}
    />
  )
}

function SearchScreenContent({
  navigation,
}: SearchScreenContentProps): React.ReactElement {
  const {t} = useTranslation()
  const safeAreaInsets = useSafeAreaInsets()
  const localSearchTextAtom = useMemo(() => atom(''), [])
  const localSearchText = useAtomValue(localSearchTextAtom)
  const trimmedSearchText = localSearchText.trim()

  const {searchQueryAtom, searchResultsAtomsAtom, isLoadingAtom, errorAtom} =
    useMolecule(LocationSearchMolecule)
  const setSearchQuery = useSetAtom(searchQueryAtom)
  const searchResultsAtoms = useAtomValue(searchResultsAtomsAtom)
  const isLoading = useAtomValue(isLoadingAtom)
  const error = useAtomValue(errorAtom)

  useEffect(() => {
    if (trimmedSearchText === '') {
      setSearchQuery('')
      return
    }

    const timeout = setTimeout(() => {
      setSearchQuery(trimmedSearchText)
    }, 200)

    return () => {
      clearTimeout(timeout)
    }
  }, [setSearchQuery, trimmedSearchText])

  return (
    <YStack
      flex={1}
      backgroundColor="$backgroundPrimary"
      pt={safeAreaInsets.top}
    >
      <NavigationBar
        style="back"
        title={t('tradeChecklist.options.MEETING_LOCATION')}
        leftAction={{icon: ChevronLeft, onPress: navigation.goBack}}
      />
      <YStack px="$5" pb="$5">
        <SearchBar
          valueAtom={localSearchTextAtom}
          autoFocus
          placeholder={t('offerForm.location.addCityOrDistrict')}
        />
      </YStack>
      {isLoading ? (
        <YStack px="$5" pt="$8">
          <Typography
            variant="description"
            color="$foregroundSecondary"
            textAlign="center"
          >
            {t('common.loading')}...
          </Typography>
        </YStack>
      ) : error != null ? (
        <EmptyState
          paddingHorizontal="$5"
          description={t('tradeChecklist.location.searchUnavailable')}
        />
      ) : trimmedSearchText !== '' && searchResultsAtoms.length === 0 ? (
        <EmptyState
          paddingHorizontal="$5"
          description={t('common.noResults')}
        />
      ) : (
        <FlatList
          keyboardShouldPersistTaps="handled"
          data={searchResultsAtoms}
          keyExtractor={atomKeyExtractor}
          contentContainerStyle={{
            paddingHorizontal: getTokens().space.$5.val,
            paddingBottom: safeAreaInsets.bottom + getTokens().space.$7.val,
          }}
          renderItem={({item}) => (
            <ResultItem
              atom={item}
              onPress={(locationData) => {
                navigation.popTo('LocationMapSelect', {
                  selectedLocation:
                    locationSuggestionToMeetingLocationData(locationData),
                })
              }}
            />
          )}
        />
      )}
    </YStack>
  )
}

export default function LocationMapSearch({
  navigation,
}: Props): React.ReactElement {
  const sessionId = useMemo(() => newLocationSessionId(), [])

  return (
    <ScopeProvider scope={LocationSearchScope} value={sessionId}>
      <SearchScreenContent navigation={navigation} />
    </ScopeProvider>
  )
}

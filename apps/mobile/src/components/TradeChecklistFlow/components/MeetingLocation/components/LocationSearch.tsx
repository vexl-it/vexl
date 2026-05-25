import {type MeetingLocationData} from '@vexl-next/domain/src/general/tradeChecklist'
import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {
  ChevronLeft,
  IconButton,
  PinGeolocation,
  SearchBar,
  Typography,
} from '@vexl-next/ui'
import {ScopeProvider, useMolecule} from 'bunshi/dist/react'
import {type Atom, atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect, useMemo} from 'react'
import {FlatList, TouchableOpacity} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, XStack, YStack, useTheme} from 'tamagui'
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
  const theme = useTheme()

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        onPress(locationData)
      }}
    >
      <XStack ai="flex-start" gap="$4" pt="$5">
        <Stack pt="$1">
          <PinGeolocation size={24} color={theme.foregroundPrimary.get()} />
        </Stack>
        <YStack
          f={1}
          gap="$2"
          pb="$5"
          borderBottomWidth={1}
          borderBottomColor="$backgroundTertiary"
        >
          <Typography variant="paragraphSmall" color="$foregroundPrimary">
            {locationData.userData.suggestFirstRow}
          </Typography>
          {locationData.userData.suggestSecondRow ? (
            <Typography variant="description" color="$foregroundSecondary">
              {locationData.userData.suggestSecondRow}
            </Typography>
          ) : null}
        </YStack>
      </XStack>
    </TouchableOpacity>
  )
}

function SearchScreenContent({
  navigation,
}: SearchScreenContentProps): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const safeAreaInsets = useSafeAreaInsets()
  const localSearchTextAtom = useMemo(() => atom(''), [])
  const localSearchText = useAtomValue(localSearchTextAtom)
  const trimmedSearchText = localSearchText.trim()

  const {searchQueryAtom, searchResultsAtomsAtom} = useMolecule(
    LocationSearchMolecule
  )
  const setSearchQuery = useSetAtom(searchQueryAtom)
  const searchResultsAtoms = useAtomValue(searchResultsAtomsAtom)

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
      <YStack px="$5" pb="$5" gap="$5">
        <XStack ai="center">
          <IconButton
            backgroundColor="$accentYellowSecondary"
            onPress={navigation.goBack}
          >
            <ChevronLeft
              size={24}
              color={theme.accentHighlightSecondary.get()}
            />
          </IconButton>
          <Stack f={1} ai="center">
            <Typography
              variant="titlesSmall"
              color="$foregroundPrimary"
              textAlign="center"
            >
              {t('tradeChecklist.options.MEETING_LOCATION')}
            </Typography>
          </Stack>
          <Stack width="$10" />
        </XStack>
        <SearchBar
          valueAtom={localSearchTextAtom}
          autoFocus
          placeholder={t('offerForm.location.addCityOrDistrict')}
        />
      </YStack>
      {trimmedSearchText !== '' && searchResultsAtoms.length === 0 ? (
        <YStack px="$5" pt="$8">
          <Typography
            variant="description"
            color="$foregroundSecondary"
            textAlign="center"
          >
            {t('common.noResults')}
          </Typography>
        </YStack>
      ) : (
        <FlatList
          keyboardShouldPersistTaps="handled"
          data={searchResultsAtoms}
          keyExtractor={atomKeyExtractor}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: safeAreaInsets.bottom + 24,
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

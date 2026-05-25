import {useNavigation} from '@react-navigation/native'
import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {NavigationBar, Screen, SearchBar, Typography} from '@vexl-next/ui'
import {ChevronLeft, PinGeolocation} from '@vexl-next/ui/src/icons'
import {Stack, XStack, YStack} from '@vexl-next/ui/src/primitives'
import {ScopeProvider, useMolecule} from 'bunshi/dist/react'
import type {Atom} from 'jotai'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import {FlatList} from 'react-native'
import {debounce, useTheme} from 'tamagui'
import {type RootStackParamsList} from '../../navigationTypes'
import atomKeyExtractor from '../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {
  LocationSearchMolecule,
  LocationSearchScope,
  newLocationSessionId,
} from '../LocationSearch/molecule'
import {LocationPickerMolecule} from './molecule'
import {locationSuggestionToMapValue} from './utils'

type Props =
  | {
      readonly radiusRouteName: 'OfferLocationRadius'
      readonly radiusRouteParams?: RootStackParamsList['OfferLocationRadius']
    }
  | {
      readonly radiusRouteName: 'FilterLocationRadius'
    }

function LocationSearchContent({
  onLocationSelect,
}: {
  readonly onLocationSelect: (locationSuggestion: LocationSuggestion) => void
}): React.JSX.Element {
  const {t} = useTranslation()
  const {searchQueryAtom, searchResultsAtomsAtom, isLoadingAtom} = useMolecule(
    LocationSearchMolecule
  )

  const searchResultsAtoms = useAtomValue(searchResultsAtomsAtom)
  const isLoading = useAtomValue(isLoadingAtom)
  const setSearchQuery = useSetAtom(searchQueryAtom)

  const setSearchQueryRef = useRef(setSearchQuery)
  setSearchQueryRef.current = setSearchQuery

  const debouncedSetSearchQueryRef = useRef(
    debounce((text: string) => {
      setSearchQueryRef.current(text)
    }, 200)
  )

  const searchValueAtom = useMemo(() => {
    const baseAtom = atom('')
    return atom(
      (get) => get(baseAtom),
      (get, set, update: React.SetStateAction<string>) => {
        const prev = get(baseAtom)
        const newValue = typeof update === 'function' ? update(prev) : update
        set(baseAtom, newValue)
        if (newValue.trim() === '') {
          setSearchQueryRef.current('')
        } else {
          debouncedSetSearchQueryRef.current(newValue)
        }
      }
    )
  }, [])

  const renderItem = useCallback(
    ({item}: {item: Atom<LocationSuggestion>}): React.ReactElement => {
      return <LocationResultItem atom={item} onPress={onLocationSelect} />
    },
    [onLocationSelect]
  )

  return (
    <YStack flex={1} gap="$6">
      <SearchBar
        valueAtom={searchValueAtom}
        placeholder={t('offerForm.location.addCityOrDistrict')}
        autoFocus
      />
      {isLoading ? (
        <Typography
          variant="paragraph"
          color="$foregroundSecondary"
          textAlign="center"
          paddingTop="$10"
        >
          {t('common.loading')}...
        </Typography>
      ) : searchResultsAtoms.length === 0 ? (
        <Typography
          variant="paragraph"
          color="$foregroundSecondary"
          textAlign="center"
          paddingTop="$10"
        >
          {t('common.noResults')}
        </Typography>
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          keyExtractor={atomKeyExtractor}
          data={searchResultsAtoms}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </YStack>
  )
}

function LocationResultItem({
  atom: locationAtom,
  onPress,
}: {
  readonly atom: Atom<LocationSuggestion>
  readonly onPress: (data: LocationSuggestion) => void
}): React.JSX.Element {
  const data = useAtomValue(locationAtom)
  const theme = useTheme()

  return (
    <Stack
      role="button"
      onPress={() => {
        onPress(data)
      }}
      pressStyle={{opacity: 0.7}}
    >
      <XStack gap="$5" alignItems="flex-start">
        <Stack paddingTop="$1">
          <PinGeolocation size={24} color={theme.foregroundPrimary.get()} />
        </Stack>
        <YStack flex={1} gap="$5">
          <YStack gap="$1">
            <Typography variant="paragraph" color="$foregroundPrimary">
              {data.userData.suggestFirstRow}
            </Typography>
            <Typography variant="description" color="$foregroundSecondary">
              {data.userData.suggestSecondRow}
            </Typography>
          </YStack>
          <Stack height={1} backgroundColor="$backgroundHighlight" />
        </YStack>
      </XStack>
    </Stack>
  )
}

export default function LocationSearchPicker(props: Props): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {selectedMapValueAtom} = useMolecule(LocationPickerMolecule)
  const setSelectedMapValue = useSetAtom(selectedMapValueAtom)

  const [sessionId] = useState(() => newLocationSessionId())

  const handleLocationSelect = useCallback(
    (locationSuggestion: LocationSuggestion) => {
      setSelectedMapValue(locationSuggestionToMapValue(locationSuggestion))
      if (props.radiusRouteName === 'OfferLocationRadius') {
        navigation.navigate('OfferLocationRadius', props.radiusRouteParams)
      } else {
        navigation.navigate('FilterLocationRadius')
      }
    },
    [setSelectedMapValue, navigation, props]
  )

  return (
    <ScopeProvider scope={LocationSearchScope} value={sessionId}>
      <Screen
        navigationBar={
          <NavigationBar
            style="back"
            title={t('offerForm.setLocation')}
            leftAction={{
              icon: ChevronLeft,
              onPress: () => {
                navigation.goBack()
              },
            }}
          />
        }
      >
        <LocationSearchContent onLocationSelect={handleLocationSelect} />
      </Screen>
    </ScopeProvider>
  )
}

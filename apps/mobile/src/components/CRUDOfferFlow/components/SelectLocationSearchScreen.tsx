import {useNavigation, useRoute} from '@react-navigation/native'
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
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {
  LocationSearchScope,
  newLocationSessionId,
  useLocationSearchMolecule,
} from '../../LocationSearch/molecule'
import {type MapValue} from '../../Map/brands'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'

function LocationSearchContent({
  onLocationSelect,
}: {
  readonly onLocationSelect: (mapValue: MapValue) => void
}): React.JSX.Element {
  const {t} = useTranslation()
  const {searchQueryAtom, searchResultsAtomsAtom, isLoadingAtom} =
    useLocationSearchMolecule()

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
      (_get, set, update: React.SetStateAction<string>) => {
        const prev = _get(baseAtom)
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

  const handleLocationPress = useCallback(
    (data: LocationSuggestion) => {
      onLocationSelect({
        placeId: data.userData.placeId,
        address: `${data.userData.suggestFirstRow}, ${data.userData.suggestSecondRow}`,
        latitude: data.userData.latitude,
        longitude: data.userData.longitude,
        viewport: data.userData.viewport,
      })
    },
    [onLocationSelect]
  )

  const renderItem = useCallback(
    ({item}: {item: Atom<LocationSuggestion>}): React.ReactElement => {
      return <LocationResultItem atom={item} onPress={handleLocationPress} />
    },
    [handleLocationPress]
  )

  return (
    <YStack flex={1} gap="$6">
      <SearchBar
        valueAtom={searchValueAtom}
        placeholder={t('offerForm.location.addCityOrDistrict')}
        autoFocus
      />
      {searchResultsAtoms.length === 0 && !isLoading ? (
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
          <PinGeolocation size={24} color={theme.foregroundPrimary.val} />
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

export default function SelectLocationSearchScreen(): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const route = useRoute()
  const params = (route.params ?? {}) as {
    randomizeLocation?: boolean
  }
  const randomizeLocation = params.randomizeLocation ?? false

  const {selectedMapValueAtom} = useMolecule(offerFormMolecule)
  const setSelectedMapValue = useSetAtom(selectedMapValueAtom)

  const [sessionId] = useState(() => newLocationSessionId())

  const handleLocationSelect = useCallback(
    (mapValue: MapValue) => {
      setSelectedMapValue(mapValue)
      navigation.navigate('SelectLocationRadius', {randomizeLocation})
    },
    [setSelectedMapValue, navigation, randomizeLocation]
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

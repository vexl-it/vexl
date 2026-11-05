import {useNavigation} from '@react-navigation/native'
import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {
  EmptyState,
  LocationSuggestionRow,
  NavigationBar,
  Screen,
  SearchBar,
  Typography,
  useKeyboardAwareFooterListPadding,
} from '@vexl-next/ui'
import {ChevronLeft} from '@vexl-next/ui/src/icons'
import {YStack} from '@vexl-next/ui/src/primitives'
import {ScopeProvider, useMolecule} from 'bunshi/dist/react'
import type {Atom} from 'jotai'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import {FlatList} from 'react-native'
import {debounce} from 'tamagui'
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
  onPickOnMap,
}: {
  readonly onLocationSelect: (locationSuggestion: LocationSuggestion) => void
  readonly onPickOnMap: () => void
}): React.JSX.Element {
  const {t} = useTranslation()
  const {searchQueryAtom, searchResultsAtomsAtom, isLoadingAtom, errorAtom} =
    useMolecule(LocationSearchMolecule)

  const searchResultsAtoms = useAtomValue(searchResultsAtomsAtom)
  const isLoading = useAtomValue(isLoadingAtom)
  const error = useAtomValue(errorAtom)
  const currentQuery = useAtomValue(searchQueryAtom)
  const setSearchQuery = useSetAtom(searchQueryAtom)
  const listPaddingBottom = useKeyboardAwareFooterListPadding()

  const handleRetry = useCallback(() => {
    setSearchQuery(currentQuery)
  }, [currentQuery, setSearchQuery])

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
      ) : error != null ? (
        <EmptyState
          description={t('offerForm.location.searchError')}
          action={{
            label: t('common.tryAgain'),
            onPress: handleRetry,
            variant: 'primary',
          }}
          secondaryAction={{
            label: t('offerForm.location.pickOnMap'),
            onPress: onPickOnMap,
          }}
        />
      ) : searchResultsAtoms.length === 0 ? (
        <EmptyState description={t('common.noResults')} />
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          keyExtractor={atomKeyExtractor}
          data={searchResultsAtoms}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{paddingBottom: listPaddingBottom}}
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

  return (
    <LocationSuggestionRow
      title={data.userData.suggestFirstRow}
      subtitle={data.userData.suggestSecondRow}
      onPress={() => {
        onPress(data)
      }}
    />
  )
}

export default function LocationSearchPicker(props: Props): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {selectedMapValueAtom, isLocationServiceDownAtom} = useMolecule(
    LocationPickerMolecule
  )
  const setSelectedMapValue = useSetAtom(selectedMapValueAtom)
  const setIsLocationServiceDown = useSetAtom(isLocationServiceDownAtom)

  const [sessionId] = useState(() => newLocationSessionId())

  const navigateToRadius = useCallback(() => {
    if (props.radiusRouteName === 'OfferLocationRadius') {
      navigation.navigate('OfferLocationRadius', props.radiusRouteParams)
    } else {
      navigation.navigate('FilterLocationRadius')
    }
  }, [navigation, props])

  const handleLocationSelect = useCallback(
    (locationSuggestion: LocationSuggestion) => {
      setIsLocationServiceDown(false)
      setSelectedMapValue(locationSuggestionToMapValue(locationSuggestion))
      navigateToRadius()
    },
    [navigateToRadius, setIsLocationServiceDown, setSelectedMapValue]
  )

  const handlePickOnMapFallback = useCallback(() => {
    setSelectedMapValue(null)
    setIsLocationServiceDown(true)
    navigateToRadius()
  }, [navigateToRadius, setIsLocationServiceDown, setSelectedMapValue])

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
        <LocationSearchContent
          onLocationSelect={handleLocationSelect}
          onPickOnMap={handlePickOnMapFallback}
        />
      </Screen>
    </ScopeProvider>
  )
}

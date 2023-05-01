import {useGetLocationSuggestions} from '../../api'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {type SetStateAction, useAtom, type WritableAtom} from 'jotai'
import {useCallback, useEffect, useState} from 'react'
import {useDebounceValue} from 'tamagui'
import {
  type GetLocationSuggestionsResponse as GetLocationSuggestionsResponseType,
  type LocationData,
} from '@vexl-next/rest-api/dist/services/location/contracts'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {Alert, Modal, ScrollView} from 'react-native'
import reportError from '../../../../utils/reportError'
import Screen from '../../../Screen'
import ScreenTitle from '../../../ScreenTitle'
import Input from '../../../Input'
import magnifyingGlass from '../../../images/magnifyingGlass'
import LocationCell from './LocationCell'
import {type Location} from '@vexl-next/domain/dist/general/offers'
import {toCommonErrorMessage} from '../../../../utils/useCommonErrorMessages'

interface Props {
  locationAtom: WritableAtom<Location[], [SetStateAction<Location[]>], void>
  onClosePress: () => void
  visible: boolean
}

function LocationSearch({
  locationAtom,
  onClosePress,
  visible,
}: Props): JSX.Element {
  const getLocationSuggestions = useGetLocationSuggestions()
  const {t} = useTranslation()
  const [location, setLocation] = useAtom(locationAtom)
  const [inputValue, setInputValue] = useState<string>('')
  const debouncedSearchValue = useDebounceValue(inputValue, 1000)
  const [locationResults, setLocationResults] = useState<
    GetLocationSuggestionsResponseType | undefined
  >()

  const searchLocation = useCallback(() => {
    void pipe(
      getLocationSuggestions({phrase: debouncedSearchValue, lang: 'cs'}),
      TE.match(
        (e) => {
          if (e._tag === 'NetworkError') {
            Alert.alert(
              toCommonErrorMessage(e, t) ??
                t('createOffer.errorSearchingForAvailableLocation')
            )
            return
          }

          Alert.alert(t('createOffer.errorSearchingForAvailableLocation'))
          reportError(
            'error',
            'Error when getting user location to create offer',
            e
          )
        },
        (locations) => {
          setLocationResults(locations)
        }
      )
    )()
  }, [t, debouncedSearchValue, getLocationSuggestions])

  const onLocationCellPress = (selectedLocation: LocationData): void => {
    if (
      !location.some(
        (offerLocation) => offerLocation.city === selectedLocation.municipality
      )
    ) {
      setLocation([
        ...location,
        {
          latitude: String(selectedLocation.latitude),
          longitude: String(selectedLocation.longitude),
          city: selectedLocation.municipality,
        },
      ])
    }
    onClosePress()
  }

  useEffect(() => {
    if (debouncedSearchValue.length > 0) {
      searchLocation()
    }
  }, [debouncedSearchValue, searchLocation])

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <Screen customHorizontalPadding={16}>
        <ScreenTitle onClosePress={onClosePress} text={''} />
        <Input
          autoFocus
          autoCorrect={false}
          value={inputValue}
          onChangeText={setInputValue}
          textColor="$greyOnBlack"
          icon={magnifyingGlass}
          variant="greyOnBlack"
          placeholder={t('createOffer.location.addCityOrDistrict')}
          showClearButton
        />
        <ScrollView>
          {locationResults?.result.map((result) => {
            const {latitude, suggestFirstRow, suggestSecondRow} =
              result.userData
            return (
              <LocationCell
                key={latitude}
                city={suggestFirstRow}
                country={suggestSecondRow}
                onPress={() => {
                  onLocationCellPress(result.userData)
                }}
              />
            )
          })}
        </ScrollView>
      </Screen>
    </Modal>
  )
}

export default LocationSearch

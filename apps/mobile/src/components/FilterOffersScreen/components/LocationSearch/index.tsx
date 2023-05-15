import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {type PrimitiveAtom, useAtom} from 'jotai'
import React, {useCallback, useEffect, useState} from 'react'
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
import IconButton from '../../../IconButton'
import closeSvg from '../../../images/closeSvg'
import {toCommonErrorMessage} from '../../../../utils/useCommonErrorMessages'
import {useGetLocationSuggestions} from '../../../ModifyOffer/api'
import {type Location} from '@vexl-next/domain/dist/general/offers'

interface Props {
  locationAtom: PrimitiveAtom<Location[] | undefined>
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
  const [inputValue, setInputValue] = useState<string>('')
  const debouncedSearchValue = useDebounceValue(inputValue, 1000)
  const [locationResults, setLocationResults] = useState<
    GetLocationSuggestionsResponseType | undefined
  >()

  const [location, setLocation] = useAtom(locationAtom)

  const searchLocation = useCallback(() => {
    void pipe(
      getLocationSuggestions({phrase: debouncedSearchValue, lang: 'cs'}),
      TE.match(
        (e) => {
          Alert.alert(
            toCommonErrorMessage(e, t) ??
              t('offerForm.errorSearchingForAvailableLocation')
          )
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
      !location?.some(
        (offerLocation) => offerLocation.city === selectedLocation.municipality
      )
    ) {
      setLocation([
        ...(location ?? []),
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
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClosePress}
    >
      <Screen customHorizontalPadding={16}>
        <ScreenTitle text={''}>
          <IconButton variant="dark" icon={closeSvg} onPress={onClosePress} />
        </ScreenTitle>
        <Input
          autoFocus
          autoCorrect={false}
          value={inputValue}
          onChangeText={setInputValue}
          textColor="$greyOnBlack"
          icon={magnifyingGlass}
          variant="greyOnBlack"
          placeholder={t('offerForm.location.addCityOrDistrict')}
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

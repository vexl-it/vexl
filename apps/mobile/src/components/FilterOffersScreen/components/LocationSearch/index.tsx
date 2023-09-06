import {i18nAtom, useTranslation} from '../../../../utils/localization/I18nProvider'
import {useSetAtom, useAtomValue} from 'jotai'
import React, {useEffect, useRef, useState} from 'react'
import {useDebounceValue} from 'tamagui'
import {Modal, Platform, type TextInput} from 'react-native'
import Screen from '../../../Screen'
import ScreenTitle from '../../../ScreenTitle'
import Input from '../../../Input'
import magnifyingGlass from '../../../images/magnifyingGlass'
import IconButton from '../../../IconButton'
import closeSvg from '../../../images/closeSvg'
import LocationsList from './LocationsList'
import {
  updateAndRefreshLocationSuggestionsActionAtom,
  locationSuggestionsAtom,
  locationSuggestionsAtomsAtom,
} from '../../atom'

interface Props {
  onClosePress: () => void
  visible: boolean
}

function LocationSearch({onClosePress, visible}: Props): JSX.Element {
  const {t} = useTranslation()
  const inputRef = useRef<TextInput>(null)
  const i18n = useAtomValue(i18nAtom)
  const [inputValue, setInputValue] = useState<string>('')
  const debouncedSearchValue = useDebounceValue(inputValue, 1000)
  const updateAndRefreshLocationSuggestions = useSetAtom(
    updateAndRefreshLocationSuggestionsActionAtom
  )
  const locationSuggestionsAtoms = useAtomValue(locationSuggestionsAtomsAtom)
  const setLocationSuggestions = useSetAtom(locationSuggestionsAtom)

  function onInputValueChange(value: string): void {
    if (value === '') setLocationSuggestions([])
    setInputValue(value)
  }

  useEffect(() => {
    if (debouncedSearchValue.length > 0) {
      void updateAndRefreshLocationSuggestions({
        phrase: debouncedSearchValue,
        lang: i18n.locale,
      })
    }

    return () => {
      setLocationSuggestions([])
    }
  }, [
    debouncedSearchValue,
    updateAndRefreshLocationSuggestions,
    i18n.locale,
    setLocationSuggestions,
  ])

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClosePress}
      onShow={() => {
        if (Platform.OS === 'android') {
          setTimeout(() => {
            inputRef.current?.blur()
            inputRef.current?.focus()
          }, 100)
        }
      }}
    >
      <Screen customHorizontalPadding={16}>
        <ScreenTitle text={''}>
          <IconButton variant="dark" icon={closeSvg} onPress={onClosePress} />
        </ScreenTitle>
        <Input
          ref={inputRef}
          autoFocus={Platform.OS === 'ios'}
          value={inputValue}
          onChangeText={onInputValueChange}
          textColor="$greyOnBlack"
          icon={magnifyingGlass}
          variant="greyOnBlack"
          placeholder={t('offerForm.location.addCityOrDistrict')}
          showClearButton={!!inputValue}
          onClearPress={() => {
            setInputValue('')
            setLocationSuggestions([])
          }}
        />
        <LocationsList
          locationSuggestionsAtoms={locationSuggestionsAtoms}
          onClose={onClosePress}
        />
      </Screen>
    </Modal>
  )
}

export default LocationSearch

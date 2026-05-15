import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {type ICountry} from 'react-native-country-select'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import CountryPickerScreenContent from '../../CountryPickerScreenContent'
import {selectedCountryCodeAtom} from '../atoms/selectedCountryCodeAtom'

type Props = LoginFlowStackScreenProps<'CountryPicker'>

export default function CountryPickerScreen({
  navigation,
}: Props): React.ReactElement {
  const setSelectedCountryCode = useSetAtom(selectedCountryCodeAtom)

  const handleSelect = useCallback(
    (country: ICountry) => {
      setSelectedCountryCode(country.cca2)
      navigation.goBack()
    },
    [navigation, setSelectedCountryCode]
  )

  return (
    <CountryPickerScreenContent
      onClose={navigation.goBack}
      onSelect={handleSelect}
    />
  )
}

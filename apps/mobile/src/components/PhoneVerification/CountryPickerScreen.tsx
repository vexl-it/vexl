import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {type ICountry} from 'react-native-country-select'
import CountryPickerScreenContent from '../CountryPickerScreenContent'
import {selectedCountryCodeAtom} from './selectedCountryCodeAtom'

interface Props {
  readonly navigation: {readonly goBack: () => void}
}

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

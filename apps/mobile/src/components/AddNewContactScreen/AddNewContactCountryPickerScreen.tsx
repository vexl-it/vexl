import {useMolecule} from 'bunshi/dist/react'
import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {type ICountry} from 'react-native-country-select'
import {type RootStackScreenProps} from '../../navigationTypes'
import {contactSelectMolecule} from '../ContactPreferencesScreen/components/ContactListSelect/atom'
import CountryPickerScreenContent from '../CountryPickerScreenContent'

type Props = RootStackScreenProps<'AddNewContactCountryPicker'>

export default function AddNewContactCountryPickerScreen({
  navigation,
}: Props): React.ReactElement {
  const {addNewContactSelectedCountryCodeAtom} = useMolecule(
    contactSelectMolecule
  )
  const setSelectedCountryCode = useSetAtom(
    addNewContactSelectedCountryCodeAtom
  )

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

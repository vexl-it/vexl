import {
  toE164PhoneNumber,
  type E164PhoneNumber,
} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import type * as O from 'fp-ts/Option'
import {useCallback, useState} from 'react'
import PhoneInput, {
  type ICountry,
} from 'react-native-international-phone-number'
import {XStack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

interface Props {
  onChange: (e164: O.Option<E164PhoneNumber>) => void
}

export default function PhoneNumberInput({onChange}: Props): JSX.Element {
  const {t} = useTranslation()
  const [selectedCountry, setSelectedCountry] = useState<null | ICountry>(null)
  const [phoneNumber, setPhoneNumber] = useState<string>('')

  const handlePhoneChange = useCallback(
    (value: string) => {
      // to avoid calling onChange too often, we call it only when the phone number becomes valid/invalid
      const previousPhoneNumberValid =
        toE164PhoneNumber(String(`${selectedCountry?.idd.root}${phoneNumber}`))
          ._tag === 'Some'
      const completePhoneNumber = String(`${selectedCountry?.idd.root}${value}`)
      const phoneNumberAsOption = toE164PhoneNumber(completePhoneNumber)

      setPhoneNumber(value)

      if (phoneNumberAsOption._tag === 'Some' || previousPhoneNumberValid) {
        onChange(phoneNumberAsOption)
      }
    },
    [onChange, phoneNumber, selectedCountry?.idd.root]
  )
  return (
    <XStack bg="$greyAccent5" px="$3" br="$4" mx="$-4">
      <PhoneInput
        inputMode="tel"
        autoFocus
        placeholder=""
        value={phoneNumber}
        onChangePhoneNumber={handlePhoneChange}
        selectedCountry={selectedCountry}
        onChangeSelectedCountry={setSelectedCountry}
        modalSearchInputPlaceholder={t(
          'loginFlow,phoneNumber.enterYourCountry'
        )}
        defaultCountry="CZ"
        popularCountries={['CZ', 'SK', 'DE', 'IT']}
        modalAllCountriesTitle={t('loginFlow,phoneNumber.allCountries')}
        modalPopularCountriesTitle={t('loginFlow,phoneNumber.popularCountries')}
        phoneInputStyles={{
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
          flagContainer: {
            alignItems: 'center',
            paddingRight: 0,
          },
          divider: {
            backgroundColor: 'transparent',
          },
          callingCode: {
            fontFamily: 'TTSatoshi500',
          },
          input: {
            fontFamily: 'TTSatoshi500',
          },
        }}
        modalStyles={{
          countryNotFoundMessage: {
            color: 'transparent',
          },
        }}
      />
    </XStack>
  )
}

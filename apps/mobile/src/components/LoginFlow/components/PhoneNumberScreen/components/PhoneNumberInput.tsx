import {
  toE164PhoneNumber,
  type E164PhoneNumber,
} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import type * as O from 'fp-ts/Option'
import {useCallback, useMemo, useRef} from 'react'
import {LogBox, type StyleProp, type ViewStyle} from 'react-native'
import PhoneInput from 'react-native-phone-number-input'
import {XStack} from 'tamagui'

interface Props {
  onChange: (e164: O.Option<E164PhoneNumber>) => void
}

// needs to be disabled in order for Detox tests to work and warnings not blocking the tap actions
// react-native-phone-number-input seems not to be maintained anymore, so no crash should happen
// logs will appear in the console, but not in simulator as yellow box
LogBox.ignoreLogs([
  'Warning: Main: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
  'Warning: CountryModal: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
  'Warning: CountryPicker: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
  'Warning: Flag: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
])

export default function PhoneNumberInput({onChange}: Props): JSX.Element {
  const ref = useRef<PhoneInput>(null)

  const handleChangeFormatted = useCallback(
    (valueWithPrefix: string) => {
      // remove non ASCII chars from the number input string
      onChange(toE164PhoneNumber(valueWithPrefix.replace(/[^\x20-\x7E]/g, '')))
    },
    [onChange]
  )

  const containerStyle: StyleProp<ViewStyle> = useMemo(
    () => ({
      margin: 0,
      padding: 0,
      backgroundColor: 'transparent',
    }),
    []
  )
  const codeTextStyle: StyleProp<ViewStyle> = useMemo(
    () => ({
      margin: 0,
      fontSize: 18,
      fontFamily: 'TTSatoshi500',
      alignItems: 'center',
      paddingHorizontal: 8,
    }),
    []
  )
  const textContainerStyle: StyleProp<ViewStyle> = useMemo(
    () => ({
      backgroundColor: 'transparent',
      padding: 0,
      margin: 0,
    }),
    []
  )
  const textInputStyle: StyleProp<ViewStyle> = useMemo(
    () => ({
      margin: 0,
      fontSize: 18,
      fontFamily: 'TTSatoshi500',
      alignItems: 'center',
      padding: 0,
    }),
    []
  )
  const countryPickerButtonStyle: StyleProp<ViewStyle> = useMemo(
    () => ({
      backgroundColor: '#e3e3e3',
      borderRadius: 10,
      margin: 0,
      padding: 0,
      alignItems: 'center',
      justifyContent: 'center',
      width: 60,
    }),
    []
  )
  const flagButtonStyle: StyleProp<ViewStyle> = useMemo(
    () => ({
      margin: 0,
      padding: 0,
      transform: [{scale: 0.8}],
    }),
    []
  )

  return (
    <XStack bg="$greyAccent5" px="$3" br="$4" mx="$-4">
      <PhoneInput
        textInputProps={{
          testID: 'phone-number-input',
        }}
        ref={ref}
        placeholder={' '}
        onChangeFormattedText={handleChangeFormatted}
        defaultCode="CZ"
        countryPickerProps={{
          preferredCountries: ['CZ', 'SK'],
          translation: 'common',
        }}
        containerStyle={containerStyle}
        codeTextStyle={codeTextStyle}
        textContainerStyle={textContainerStyle}
        textInputStyle={textInputStyle}
        countryPickerButtonStyle={countryPickerButtonStyle}
        flagButtonStyle={flagButtonStyle}
      />
    </XStack>
  )
}

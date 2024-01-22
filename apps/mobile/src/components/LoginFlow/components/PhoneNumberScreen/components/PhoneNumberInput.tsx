import {
  toE164PhoneNumber,
  type E164PhoneNumber,
} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import type * as O from 'fp-ts/Option'
import {useCallback, useMemo, useRef} from 'react'
import {type StyleProp, type ViewStyle} from 'react-native'
import PhoneInput from 'react-native-phone-number-input'
import {XStack} from 'tamagui'

interface Props {
  onChange: (e164: O.Option<E164PhoneNumber>) => void
}

export default function PhoneNumberInput({onChange}: Props): JSX.Element {
  const ref = useRef<PhoneInput>(null)

  const handleChangeFormatted = useCallback(
    (valueWithPrefix: string) => {
      onChange(toE164PhoneNumber(valueWithPrefix))
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

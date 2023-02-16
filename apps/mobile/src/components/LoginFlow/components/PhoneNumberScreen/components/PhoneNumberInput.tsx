import PhoneInput from 'react-native-phone-number-input'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {css} from '@emotion/native'
import {useTheme} from '@emotion/react'
import {useCallback, useRef} from 'react'
import type * as O from 'fp-ts/Option'
import {
  toE164PhoneNumber,
  type E164PhoneNumber,
} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'

interface Props {
  onChange: (e164: O.Option<E164PhoneNumber>) => void
  style?: StyleProp<ViewStyle>
}

export default function PhoneNumberInput({
  onChange,
  style,
}: Props): JSX.Element {
  const ref = useRef<PhoneInput>(null)

  const handleChangeFormatted = useCallback(
    (valueWithPrefix: string) => {
      onChange(toE164PhoneNumber(valueWithPrefix))
    },
    [onChange]
  )

  const theme = useTheme()
  return (
    <View
      style={[
        css`
          margin: 0;
          background-color: #f2f2f2;
          flex-direction: row;
          padding: 12px;
          border-radius: 10px;
          margin: 0 -16px;
        `,
        style,
      ]}
    >
      <PhoneInput
        ref={ref}
        placeholder={' '}
        onChangeFormattedText={handleChangeFormatted}
        defaultCode={'CZ'}
        countryPickerProps={{
          preferredCountries: ['CZ', 'SK'],
          translation: 'common',
        }}
        containerStyle={css`
          margin: 0;
          padding: 0;
          background-color: transparent;
        `}
        codeTextStyle={css`
          margin: 0;
          font-size: 18px;
          font-family: '${theme.fonts.ttSatoshi500}';
          align-items: center;
          padding: 0 8px 0 8px;
        `}
        textContainerStyle={css`
          background-color: transparent;
          padding: 0;
          margin: 0;
        `}
        textInputStyle={css`
          margin: 0;
          font-size: 18px;
          font-family: '${theme.fonts.ttSatoshi500}';
          align-items: center;
          padding: 0;
        `}
        countryPickerButtonStyle={css`
          background-color: #e3e3e3;
          border-radius: 10px;
          margin: 0;
          padding: 0;
          //background-color: transparent;
          align-items: center;
          justify-content: center;
          width: 60px;
        `}
        flagButtonStyle={css`
          margin: 0;
          padding: 0;
          transform: scale(0.8);
        `}
      />
    </View>
  )
}

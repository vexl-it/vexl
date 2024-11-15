import {useAtom, useAtomValue, useSetAtom, type PrimitiveAtom} from 'jotai'
import {useRef, useState} from 'react'
import {TouchableOpacity, type TextInput} from 'react-native'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import chevronDownSvg from '../../../../../images/chevronDownSvg'
import {SATOSHIS_IN_BTC} from '../../../../../state/currentBtcPriceAtoms'
import Image from '../../../../Image'
import {
  btcOrSatAtom,
  calculateFiatValueOnBtcAmountChangeActionAtom,
  switchBtcOrSatValueActionAtom,
} from '../../../atoms'
import {
  addThousandsSeparatorSpacesToNumberInput,
  removeThousandsSeparatorSpacesFromNumberInput,
  replaceNonDecimalCharsInInput,
} from '../../../utils'
import AmountInput from './AmountInput'
import CalculatedWithLiveRate from './CalculatedWithLiveRate'

const BTC_INPUT_PLACEHOLDER = '1'
const SATS_INPUT_PLACEHOLDER = `${SATOSHIS_IN_BTC}`

interface Props {
  automaticCalculationDisabled?: boolean
  editable?: boolean
  btcValueAtom: PrimitiveAtom<string>
}

function BtcAmountInput({
  automaticCalculationDisabled,
  btcValueAtom,
  editable = true,
}: Props): JSX.Element {
  const ref = useRef<TextInput>(null)
  const [isFocused, setIsFocused] = useState<boolean>(false)

  const [btcValue, setBtcValue] = useAtom(btcValueAtom)
  const btcOrSat = useAtomValue(btcOrSatAtom)
  const switchBtcOrSatValue = useSetAtom(switchBtcOrSatValueActionAtom)
  const calculateFiatValueOnBtcAmountChange = useSetAtom(
    calculateFiatValueOnBtcAmountChangeActionAtom
  )

  return (
    <AmountInput
      ref={ref}
      editable={editable}
      isFocused={isFocused}
      onBlur={() => {
        setIsFocused(false)
        setBtcValue(addThousandsSeparatorSpacesToNumberInput(btcValue))
      }}
      onFocus={() => {
        setIsFocused(true)
        setBtcValue(removeThousandsSeparatorSpacesFromNumberInput(btcValue))
      }}
      onWrapperPress={() => {
        ref.current?.focus()
      }}
      placeholder={
        btcOrSat === 'BTC' ? BTC_INPUT_PLACEHOLDER : SATS_INPUT_PLACEHOLDER
      }
      value={btcValue}
      onChangeText={(input) => {
        calculateFiatValueOnBtcAmountChange({
          automaticCalculationDisabled,
          btcAmount: replaceNonDecimalCharsInInput(input),
        })
      }}
    >
      <Stack>
        <TouchableOpacity style={{width: 65}} onPress={switchBtcOrSatValue}>
          <XStack gap="$2">
            <Text fontSize={18} color="$white" fontFamily="$body500">
              {btcOrSat}
            </Text>
            <Image
              source={chevronDownSvg}
              stroke={getTokens().color.greyOnBlack.val}
            />
          </XStack>
        </TouchableOpacity>
        {!isFocused && !!btcValue && !automaticCalculationDisabled && (
          <CalculatedWithLiveRate />
        )}
      </Stack>
    </AmountInput>
  )
}

export default BtcAmountInput

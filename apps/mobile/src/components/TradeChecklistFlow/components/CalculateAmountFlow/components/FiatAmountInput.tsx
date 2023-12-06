import {useRef, useState} from 'react'
import {type TextInput} from 'react-native'
import {type PrimitiveAtom, useAtomValue, useSetAtom} from 'jotai'
import {calculateBtcValueOnFiatAmountChangeActionAtom} from '../atoms'
import {replaceNonDecimalCharsInInput} from '../../../utils'
import {Stack, Text} from 'tamagui'
import AmountInput from './AmountInput'
import {currencies} from '../../../../../utils/localization/currency'
import CalculatedWithLiveRate from './CalculatedWithLiveRate'
import * as fromChatAtoms from '../../../atoms/fromChatAtoms'

interface Props {
  automaticCalculationDisabled?: boolean
  fiatValueAtom: PrimitiveAtom<string>
  btcValueAtom: PrimitiveAtom<string>
  showSubtitle?: boolean
}

function FiatAmountInput({
  automaticCalculationDisabled,
  btcValueAtom,
  fiatValueAtom,
  showSubtitle,
}: Props): JSX.Element {
  const ref = useRef<TextInput>(null)
  const [isFocused, setIsFocused] = useState<boolean>(false)

  const fiatValue = useAtomValue(fiatValueAtom)
  const offerForTradeChecklist = useAtomValue(fromChatAtoms.originOfferAtom)
  const calculateBtcValueOnFiatAmountChange = useSetAtom(
    calculateBtcValueOnFiatAmountChangeActionAtom
  )

  return (
    <AmountInput
      ref={ref}
      showSubtitle={showSubtitle}
      isFocused={isFocused}
      onBlur={() => {
        setIsFocused(false)
      }}
      onFocus={() => {
        setIsFocused(true)
      }}
      onWrapperPress={() => {
        ref.current?.focus()
      }}
      placeholder={`${offerForTradeChecklist?.offerInfo.publicPart.amountTopLimit}`}
      value={fiatValue}
      onChangeText={(input) => {
        calculateBtcValueOnFiatAmountChange({
          automaticCalculationDisabled,
          fiatAmount: replaceNonDecimalCharsInInput(input),
          btcValueAtom,
          fiatValueAtom,
        })
      }}
    >
      <Stack>
        <Text fos={18} ff={'$body500'} col={'$white'}>
          {
            currencies[
              offerForTradeChecklist?.offerInfo.publicPart.currency ?? 'USD'
            ].code
          }
        </Text>
        {!isFocused && fiatValue && !automaticCalculationDisabled && (
          <CalculatedWithLiveRate />
        )}
      </Stack>
    </AmountInput>
  )
}

export default FiatAmountInput

import {useAtomValue, useSetAtom, type PrimitiveAtom} from 'jotai'
import {useRef, useState} from 'react'
import {type TextInput} from 'react-native'
import {Stack, Text} from 'tamagui'
import {originOfferCurrencyAtom} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {currencies} from '../../../../../utils/localization/currency'
import {btcPriceForOfferWithStateAtom} from '../../../atoms/btcPriceForOfferWithStateAtom'
import {replaceNonDecimalCharsInInput} from '../../../utils'
import {calculateBtcValueOnFiatAmountChangeActionAtom} from '../atoms'
import AmountInput from './AmountInput'
import CalculatedWithLiveRate from './CalculatedWithLiveRate'

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
  const calculateBtcValueOnFiatAmountChange = useSetAtom(
    calculateBtcValueOnFiatAmountChangeActionAtom
  )
  const originOfferCurrency = useAtomValue(originOfferCurrencyAtom)
  const btcPriceForOfferWithState = useAtomValue(btcPriceForOfferWithStateAtom)

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
      placeholder={
        btcPriceForOfferWithState?.state === 'success'
          ? `${btcPriceForOfferWithState.btcPrice}`
          : '-'
      }
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
        <Text fos={18} ff="$body500" col="$white">
          {currencies[originOfferCurrency ?? 'USD'].code}
        </Text>
        {!isFocused && fiatValue && !automaticCalculationDisabled && (
          <CalculatedWithLiveRate />
        )}
      </Stack>
    </AmountInput>
  )
}

export default FiatAmountInput

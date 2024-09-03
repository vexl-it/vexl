import {useAtom, useAtomValue, useSetAtom, type PrimitiveAtom} from 'jotai'
import {useRef, useState} from 'react'
import {type TextInput} from 'react-native'
import {Stack} from 'tamagui'
import CurrencySelect from '../../../../CurrencySelect'
import CurrencySelectButton from '../../../../CurrencySelectButton'
import {
  btcPriceCurrencyAtom,
  btcPriceForOfferWithStateAtom,
  calculateBtcValueOnFiatAmountChangeActionAtom,
  ownPriceAtom,
  tradePriceTypeAtom,
  updateFiatCurrencyActionAtom,
} from '../../../atoms'
import {
  addThousandsSeparatorSpacesToNumberInput,
  removeThousandsSeparatorSpacesFromNumberInput,
  replaceNonDecimalCharsInInput,
} from '../../../utils'
import AmountInput from './AmountInput'
import CalculatedWithLiveRate from './CalculatedWithLiveRate'

interface Props {
  automaticCalculationDisabled?: boolean
  currencySelectVisibleAtom: PrimitiveAtom<boolean>
  fiatValueAtom: PrimitiveAtom<string>
  showPremiumInfoMessage?: boolean
  editable?: boolean
}

function FiatAmountInput({
  automaticCalculationDisabled,
  currencySelectVisibleAtom,
  fiatValueAtom,
  showPremiumInfoMessage,
  editable = true,
}: Props): JSX.Element {
  const ref = useRef<TextInput>(null)
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const setCurrencySelectVisible = useSetAtom(currencySelectVisibleAtom)

  const [fiatValue, setFiatValue] = useAtom(fiatValueAtom)
  const calculateBtcValueOnFiatAmountChange = useSetAtom(
    calculateBtcValueOnFiatAmountChangeActionAtom
  )
  const btcPriceForOfferWithState = useAtomValue(btcPriceForOfferWithStateAtom)
  const updateFiatCurrency = useSetAtom(updateFiatCurrencyActionAtom)
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const ownPrice = useAtomValue(ownPriceAtom)

  return (
    <AmountInput
      ref={ref}
      showPremiumInfoMessage={showPremiumInfoMessage}
      isFocused={isFocused}
      loading={btcPriceForOfferWithState?.state === 'loading'}
      onBlur={() => {
        setIsFocused(false)
        setFiatValue(addThousandsSeparatorSpacesToNumberInput(fiatValue))
      }}
      onFocus={() => {
        setIsFocused(true)
        setFiatValue(removeThousandsSeparatorSpacesFromNumberInput(fiatValue))
      }}
      onWrapperPress={() => {
        ref.current?.focus()
      }}
      placeholder={
        tradePriceType === 'your'
          ? ownPrice
          : btcPriceForOfferWithState?.state === 'success'
            ? `${btcPriceForOfferWithState.btcPrice}`
            : '-'
      }
      value={fiatValue}
      onChangeText={(input) => {
        calculateBtcValueOnFiatAmountChange({
          automaticCalculationDisabled,
          fiatAmount: replaceNonDecimalCharsInInput(
            removeThousandsSeparatorSpacesFromNumberInput(input)
          ),
        })
      }}
    >
      <Stack>
        <CurrencySelectButton
          disabled={!editable}
          currencyAtom={btcPriceCurrencyAtom}
          onPress={() => {
            setCurrencySelectVisible(true)
          }}
        />
        {!isFocused && !!fiatValue && !automaticCalculationDisabled && (
          <CalculatedWithLiveRate />
        )}
      </Stack>
      <CurrencySelect
        selectedCurrencyCodeAtom={btcPriceCurrencyAtom}
        onItemPress={updateFiatCurrency}
        visibleAtom={currencySelectVisibleAtom}
      />
    </AmountInput>
  )
}

export default FiatAmountInput

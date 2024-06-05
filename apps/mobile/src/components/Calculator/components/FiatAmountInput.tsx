import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom, type PrimitiveAtom} from 'jotai'
import {useRef, useState} from 'react'
import {type TextInput} from 'react-native'
import {Stack} from 'tamagui'
import {Dropdown} from '../../Dropdown'
import {tradeCalculatorMolecule} from '../../TradeCalculator/atoms'
import AmountInput from '../../TradeCalculator/components/AmountInput'
import CalculatedWithLiveRate from '../../TradeCalculator/components/CalculatedWithLiveRate'
import {dropdownStyles} from '../../TradeCalculator/styles'
import {
  fiatCurrenciesDropdownData,
  replaceNonDecimalCharsInInput,
} from '../../TradeCalculator/utils'

interface Props {
  automaticCalculationDisabled?: boolean
  fiatValueAtom: PrimitiveAtom<string>
  showSubtitle?: boolean
  editable?: boolean
}

function FiatAmountInput({
  automaticCalculationDisabled,
  fiatValueAtom,
  showSubtitle,
  editable = true,
}: Props): JSX.Element {
  const ref = useRef<TextInput>(null)
  const [isFocused, setIsFocused] = useState<boolean>(false)

  const {
    calculateBtcValueOnFiatAmountChangeActionAtom,
    btcPriceForOfferWithStateAtom,
    updateFiatCurrencyActionAtom,
    btcPriceCurrencyAtom,
    tradePriceTypeAtom,
    ownPriceAtom,
  } = useMolecule(tradeCalculatorMolecule)

  const fiatValue = useAtomValue(fiatValueAtom)
  const calculateBtcValueOnFiatAmountChange = useSetAtom(
    calculateBtcValueOnFiatAmountChangeActionAtom
  )
  const btcPriceForOfferWithState = useAtomValue(btcPriceForOfferWithStateAtom)
  const updateFiatCurrency = useSetAtom(updateFiatCurrencyActionAtom)
  const currency = useAtomValue(btcPriceCurrencyAtom)
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const ownPrice = useAtomValue(ownPriceAtom)

  return (
    <AmountInput
      ref={ref}
      showSubtitle={showSubtitle}
      isFocused={isFocused}
      loading={btcPriceForOfferWithState?.state === 'loading'}
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
          fiatAmount: replaceNonDecimalCharsInInput(input),
        })
      }}
    >
      <Stack>
        <Dropdown
          disable={!editable}
          value={{value: currency, label: currency}}
          data={fiatCurrenciesDropdownData}
          onChange={(item) => {
            updateFiatCurrency(item.value)
          }}
          style={dropdownStyles.dropdown}
          containerStyle={dropdownStyles.dropdownContainerStyle}
          itemContainerStyle={dropdownStyles.dropdownItemContainerStyle}
          selectedTextStyle={dropdownStyles.selectedTextStyle}
        />
        {!isFocused && !!fiatValue && !automaticCalculationDisabled && (
          <CalculatedWithLiveRate />
        )}
      </Stack>
    </AmountInput>
  )
}

export default FiatAmountInput

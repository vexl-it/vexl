import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {useAtomValue, useSetAtom, type PrimitiveAtom} from 'jotai'
import {useMemo, useRef, useState} from 'react'
import {StyleSheet, type TextInput} from 'react-native'
import {Stack, getTokens} from 'tamagui'
import {tradeOrOriginOfferCurrencyAtom} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {currencies} from '../../../../../utils/localization/currency'
import {Dropdown, type DropdownItemProps} from '../../../../Dropdown'
import {replaceNonDecimalCharsInInput} from '../../../utils'
import {
  btcPriceForOfferWithStateAtom,
  calculateBtcValueOnFiatAmountChangeActionAtom,
  selectedCurrencyCodeAtom,
  toggleFiatCurrencyActionAtom,
} from '../atoms'
import AmountInput from './AmountInput'
import CalculatedWithLiveRate from './CalculatedWithLiveRate'

const styles = StyleSheet.create({
  dropdown: {
    width: 65,
  },
  dropdownContainerStyle: {
    backgroundColor: getTokens().color.greyAccent1.val,
    borderRadius: getTokens().radius[4].val,
    width: 100,
    borderWidth: 0,
    paddingTop: 10,
    paddingBottom: 10,
  },
  dropdownItemContainerStyle: {
    borderRadius: getTokens().radius[4].val,
  },
  selectedTextStyle: {
    color: getTokens().color.white.val,
    fontWeight: '500',
    fontSize: 18,
    fontFamily: 'TTSatoshi500',
  },
})

interface Props {
  automaticCalculationDisabled?: boolean
  fiatValueAtom: PrimitiveAtom<string>
  btcValueAtom: PrimitiveAtom<string>
  showSubtitle?: boolean
  editable?: boolean
}

const fiatCurrenciesDropdownData: Array<DropdownItemProps<CurrencyCode>> =
  Object.values(CurrencyCode.options).map((currency) => ({
    label: currency,
    value: currency,
  }))

function FiatAmountInput({
  automaticCalculationDisabled,
  btcValueAtom,
  fiatValueAtom,
  showSubtitle,
  editable = true,
}: Props): JSX.Element {
  const ref = useRef<TextInput>(null)
  const [isFocused, setIsFocused] = useState<boolean>(false)

  const fiatValue = useAtomValue(fiatValueAtom)
  const selectedCurrencyCode = useAtomValue(selectedCurrencyCodeAtom)
  const calculateBtcValueOnFiatAmountChange = useSetAtom(
    calculateBtcValueOnFiatAmountChangeActionAtom
  )
  const tradeOrOriginOfferCurrency = useAtomValue(
    tradeOrOriginOfferCurrencyAtom
  )
  const btcPriceForOfferWithState = useAtomValue(btcPriceForOfferWithStateAtom)
  const toggleFiatCurrency = useSetAtom(toggleFiatCurrencyActionAtom)

  const currency = useMemo(
    () =>
      selectedCurrencyCode ??
      currencies[tradeOrOriginOfferCurrency ?? 'USD'].code,
    [tradeOrOriginOfferCurrency, selectedCurrencyCode]
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
        <Dropdown
          disable={!editable}
          value={{value: currency, label: currency}}
          data={fiatCurrenciesDropdownData}
          onChange={(item) => {
            toggleFiatCurrency(item.value)
          }}
          style={styles.dropdown}
          containerStyle={styles.dropdownContainerStyle}
          itemContainerStyle={styles.dropdownItemContainerStyle}
          selectedTextStyle={styles.selectedTextStyle}
        />
        {!isFocused && !!fiatValue && !automaticCalculationDisabled && (
          <CalculatedWithLiveRate />
        )}
      </Stack>
    </AmountInput>
  )
}

export default FiatAmountInput

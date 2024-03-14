import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  useAtomValue,
  useSetAtom,
  type PrimitiveAtom,
  type WritableAtom,
} from 'jotai'
import {useRef, useState} from 'react'
import {StyleSheet, type TextInput} from 'react-native'
import {Stack, getTokens} from 'tamagui'
import chevronDownSvg from '../../../../../images/chevronDownSvg'
import {Dropdown, type DropdownItemProps} from '../../../../Dropdown'
import Image from '../../../../Image'
import CalculatorInput from './CalculatorInput'

const styles = StyleSheet.create({
  dropdown: {
    width: 65,
  },
  dropdownContainerStyle: {
    backgroundColor: getTokens().color.greyAccent1.val,
    borderRadius: getTokens().radius[4].val,
    width: 90,
    borderWidth: 0,
    paddingTop: 10,
    paddingBottom: 10,
  },
  dropdownItemContainerStyle: {
    borderRadius: getTokens().radius[4].val,
  },
  selectedTextStyle: {
    color: getTokens().color.main.val,
    fontWeight: '500',
    fontSize: 18,
    fontFamily: 'TTSatoshi500',
  },
})

interface Props {
  amountBottomLimitAtom: PrimitiveAtom<number | undefined>
  calculateSatsValueOnFiatValueChangeActionAtom: WritableAtom<
    null,
    [priceString: string],
    void
  >
  currencyAtom: PrimitiveAtom<CurrencyCode | undefined>
  changePriceCurrencyActionAtom: WritableAtom<
    null,
    [currencyCode: CurrencyCode],
    void
  >
}

const fiatCurrenciesDropdownData: Array<DropdownItemProps<CurrencyCode>> =
  Object.values(CurrencyCode.options).map((currency) => ({
    label: currency,
    value: currency,
  }))

function FiatInput({
  amountBottomLimitAtom,
  calculateSatsValueOnFiatValueChangeActionAtom,
  currencyAtom,
  changePriceCurrencyActionAtom,
}: Props): JSX.Element {
  const ref = useRef<TextInput>(null)

  const [isFocused, setIsFocused] = useState<boolean>(false)

  const currency = useAtomValue(currencyAtom) ?? 'USD'
  const amountBottomLimit = useAtomValue(amountBottomLimitAtom)
  const calculateSatsValueOnFiatValueChange = useSetAtom(
    calculateSatsValueOnFiatValueChangeActionAtom
  )
  const changePriceCurrency = useSetAtom(changePriceCurrencyActionAtom)

  return (
    <CalculatorInput
      ref={ref}
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
      value={
        amountBottomLimit && amountBottomLimit !== 0
          ? String(amountBottomLimit)
          : undefined
      }
      onChangeText={(input) => {
        calculateSatsValueOnFiatValueChange(input)
      }}
    >
      <Stack>
        <Dropdown
          value={{value: currency, label: currency}}
          data={fiatCurrenciesDropdownData}
          onChange={(item) => {
            changePriceCurrency(item.value)
          }}
          style={styles.dropdown}
          containerStyle={styles.dropdownContainerStyle}
          itemContainerStyle={styles.dropdownItemContainerStyle}
          selectedTextStyle={styles.selectedTextStyle}
          renderRightIcon={() => (
            <Image
              source={chevronDownSvg}
              stroke={getTokens().color.main.val}
            />
          )}
        />
      </Stack>
    </CalculatorInput>
  )
}

export default FiatInput

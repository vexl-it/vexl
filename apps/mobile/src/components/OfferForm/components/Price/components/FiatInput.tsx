import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  useAtomValue,
  useSetAtom,
  type PrimitiveAtom,
  type WritableAtom,
} from 'jotai'
import React, {useRef, useState} from 'react'
import {type TextInput} from 'react-native'
import {Stack} from 'tamagui'
import {useOpenChangeCurrency} from '../../../../ChangeCurrency'
import CurrencySelectButton from '../../../../CurrencySelectButton'
import CalculatorInput from './CalculatorInput'

interface Props {
  priceAtom: PrimitiveAtom<number | undefined>
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

function FiatInput({
  priceAtom,
  calculateSatsValueOnFiatValueChangeActionAtom,
  currencyAtom,
  changePriceCurrencyActionAtom,
}: Props): React.ReactElement {
  const ref = useRef<TextInput>(null)

  const [isFocused, setIsFocused] = useState<boolean>(false)

  const price = useAtomValue(priceAtom)
  const currency = useAtomValue(currencyAtom)
  const calculateSatsValueOnFiatValueChange = useSetAtom(
    calculateSatsValueOnFiatValueChangeActionAtom
  )
  const changePriceCurrency = useSetAtom(changePriceCurrencyActionAtom)
  const openChangeCurrency = useOpenChangeCurrency()

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
      value={price && price !== 0 ? String(price) : undefined}
      onChangeText={(input) => {
        calculateSatsValueOnFiatValueChange(input)
      }}
    >
      <Stack>
        <CurrencySelectButton
          currencyAtom={currencyAtom}
          onPress={() => {
            openChangeCurrency({
              selectedCurrencyCode: currency,
              onSave: changePriceCurrency,
            })
          }}
        />
      </Stack>
    </CalculatorInput>
  )
}

export default FiatInput

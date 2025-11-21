import {useFocusEffect} from '@react-navigation/native'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useRef, useState} from 'react'
import {type TextInput} from 'react-native'
import {Stack} from 'tamagui'
import CurrencySelect from '../../../../CurrencySelect'
import CurrencySelectButton from '../../../../CurrencySelectButton'
import {
  btcPriceCurrencyAtom,
  btcPriceForOfferWithStateAtom,
  currencySelectVisibleAtom,
  ownPriceAtom,
} from '../../../atoms'
import {
  addThousandsSeparatorSpacesToNumberInput,
  removeThousandsSeparatorSpacesFromNumberInput,
  replaceNonDecimalCharsInInput,
} from '../../../utils'
import AmountInput from '../../TradeCalculator/components/AmountInput'

function FiatOwnPriceInput(): React.ReactElement {
  const ref = useRef<TextInput>(null)

  const [isFocused, setIsFocused] = useState<boolean>(false)

  const btcPriceForOfferWithState = useAtomValue(btcPriceForOfferWithStateAtom)
  const setCurrencySelectVisible = useSetAtom(currencySelectVisibleAtom)
  const updateFiatCurrency = useSetAtom(btcPriceCurrencyAtom)
  const [ownPrice, setOwnPrice] = useAtom(ownPriceAtom)

  useFocusEffect(
    useCallback(() => {
      setOwnPrice(undefined)
    }, [setOwnPrice])
  )

  return (
    <AmountInput
      ref={ref}
      loading={btcPriceForOfferWithState?.state === 'loading'}
      isFocused={isFocused}
      onBlur={() => {
        setIsFocused(false)
        setOwnPrice(addThousandsSeparatorSpacesToNumberInput(ownPrice ?? '0'))
      }}
      onFocus={() => {
        setIsFocused(true)
        setOwnPrice(
          removeThousandsSeparatorSpacesFromNumberInput(ownPrice ?? '0')
        )
      }}
      onWrapperPress={() => {
        ref.current?.focus()
      }}
      placeholder={
        btcPriceForOfferWithState?.state === 'success'
          ? `${btcPriceForOfferWithState.btcPrice.BTC}`
          : '-'
      }
      value={ownPrice}
      onChangeText={(input) => {
        setOwnPrice(replaceNonDecimalCharsInInput(input))
      }}
    >
      <Stack>
        <CurrencySelectButton
          currencyAtom={btcPriceCurrencyAtom}
          onPress={() => {
            setCurrencySelectVisible(true)
          }}
        />
      </Stack>
      <CurrencySelect
        selectedCurrencyCodeAtom={btcPriceCurrencyAtom}
        onItemPress={updateFiatCurrency}
        visibleAtom={currencySelectVisibleAtom}
      />
    </AmountInput>
  )
}

export default FiatOwnPriceInput

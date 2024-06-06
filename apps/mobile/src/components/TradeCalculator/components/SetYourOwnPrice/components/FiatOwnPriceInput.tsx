import {useFocusEffect} from '@react-navigation/native'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useRef, useState} from 'react'
import {type TextInput} from 'react-native'
import {Stack} from 'tamagui'
import {Dropdown} from '../../../../Dropdown'
import {dropdownStyles} from '../../../../TradeCalculator/styles'
import {
  btcPriceCurrencyAtom,
  btcPriceForOfferWithStateAtom,
  ownPriceAtom,
} from '../../../atoms'
import {fiatCurrenciesDropdownData} from '../../../utils'
import AmountInput from '../../TradeCalculator/components/AmountInput'

function FiatOwnPriceInput(): JSX.Element {
  const ref = useRef<TextInput>(null)

  const [isFocused, setIsFocused] = useState<boolean>(false)

  const btcPriceForOfferWithState = useAtomValue(btcPriceForOfferWithStateAtom)
  const [currency, updateCurrency] = useAtom(btcPriceCurrencyAtom)
  const setOwnPrice = useSetAtom(ownPriceAtom)

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
      onChangeText={setOwnPrice}
    >
      <Stack>
        <Dropdown
          value={{value: currency, label: currency}}
          data={fiatCurrenciesDropdownData}
          onChange={(item) => {
            updateCurrency(item.value)
          }}
          style={dropdownStyles.dropdown}
          containerStyle={dropdownStyles.dropdownContainerStyle}
          itemContainerStyle={dropdownStyles.dropdownItemContainerStyle}
          selectedTextStyle={dropdownStyles.selectedTextStyle}
        />
      </Stack>
    </AmountInput>
  )
}

export default FiatOwnPriceInput

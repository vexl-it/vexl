import {type BtcOrSat} from '@vexl-next/domain/src/general/tradeChecklist'
import {
  useAtom,
  useAtomValue,
  useSetAtom,
  type PrimitiveAtom,
  type WritableAtom,
} from 'jotai'
import {useRef, useState} from 'react'
import {StyleSheet, type TextInput} from 'react-native'
import {Stack, getTokens} from 'tamagui'
import {SATOSHIS_IN_BTC} from '../../../state/currentBtcPriceAtoms'
import {Dropdown, type DropdownItemProps} from '../../Dropdown'
import AmountInput from '../../TradeCalculator/components/AmountInput'
import CalculatedWithLiveRate from '../../TradeCalculator/components/CalculatedWithLiveRate'
import {replaceNonDecimalCharsInInput} from '../../TradeCalculator/utils'

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

const btcOrSatOptions: BtcOrSat[] = ['BTC', 'SAT']
const BTC_INPUT_PLACEHOLDER = '1'
const SATS_INPUT_PLACEHOLDER = `${SATOSHIS_IN_BTC}`

interface Props {
  automaticCalculationDisabled?: boolean
  editable?: boolean
  btcValueAtom: PrimitiveAtom<string>
  btcOrSatsValueActionAtom: WritableAtom<BtcOrSat, [value: BtcOrSat], void>
}

const btcOrSatDropdownData: Array<DropdownItemProps<BtcOrSat>> =
  btcOrSatOptions.map((option) => ({
    label: option,
    value: option,
  }))

function BtcAmountInput({
  automaticCalculationDisabled,
  btcValueAtom,
  editable = true,
  btcOrSatsValueActionAtom,
}: Props): JSX.Element {
  const ref = useRef<TextInput>(null)
  const [isFocused, setIsFocused] = useState<boolean>(false)

  const btcValue = useAtomValue(btcValueAtom)
  const [btcOrSats, setBtcOrSats] = useAtom(btcOrSatsValueActionAtom)
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
      }}
      onFocus={() => {
        setIsFocused(true)
      }}
      onWrapperPress={() => {
        ref.current?.focus()
      }}
      placeholder={
        btcOrSats === 'BTC' ? BTC_INPUT_PLACEHOLDER : SATS_INPUT_PLACEHOLDER
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
        <Dropdown
          disable={!editable}
          value={{value: btcOrSats, label: btcOrSats}}
          data={btcOrSatDropdownData}
          onChange={(item) => {
            setBtcOrSats(item.value)
          }}
          style={styles.dropdown}
          containerStyle={styles.dropdownContainerStyle}
          itemContainerStyle={styles.dropdownItemContainerStyle}
          selectedTextStyle={styles.selectedTextStyle}
        />
        {!isFocused && !!btcValue && !automaticCalculationDisabled && (
          <CalculatedWithLiveRate />
        )}
      </Stack>
    </AmountInput>
  )
}

export default BtcAmountInput

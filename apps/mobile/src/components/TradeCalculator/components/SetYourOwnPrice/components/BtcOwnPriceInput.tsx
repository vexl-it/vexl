import {useRef} from 'react'
import {type TextInput} from 'react-native'
import {Text} from 'tamagui'
import AmountInput from '../../TradeCalculator/components/AmountInput'

function BtcOwnPriceInput(): JSX.Element {
  const ref = useRef<TextInput>(null)

  return (
    <AmountInput ref={ref} editable={false} value="1">
      <Text col="$white" ff="$body500" fos={18}>
        BTC
      </Text>
    </AmountInput>
  )
}

export default BtcOwnPriceInput

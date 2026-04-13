import {Typography} from '@vexl-next/ui'
import React, {useRef} from 'react'
import {type TextInput} from 'react-native'
import AmountInput from '../../TradeCalculator/components/AmountInput'

function BtcOwnPriceInput(): React.ReactElement {
  const ref = useRef<TextInput>(null)

  return (
    <AmountInput ref={ref} editable={false} value="1">
      <Typography variant="paragraphSmall" color="$foregroundPrimary">
        BTC
      </Typography>
    </AmountInput>
  )
}

export default BtcOwnPriceInput

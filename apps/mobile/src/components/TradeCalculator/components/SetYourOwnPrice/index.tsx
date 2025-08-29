import React from 'react'
import {Stack} from 'tamagui'
import BtcOwnPriceInput from './components/BtcOwnPriceInput'
import FiatOwnPriceInput from './components/FiatOwnPriceInput'
import PriceInfo from './components/PriceInfo'

function SetYourOwnPrice(): React.ReactElement {
  return (
    <Stack gap="$4">
      <Stack gap="$2">
        <BtcOwnPriceInput />
        <FiatOwnPriceInput />
      </Stack>
      <PriceInfo />
    </Stack>
  )
}

export default SetYourOwnPrice

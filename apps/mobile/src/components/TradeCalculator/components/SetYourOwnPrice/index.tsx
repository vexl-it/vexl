import {Stack} from 'tamagui'
import BtcOwnPriceInput from './components/BtcOwnPriceInput'
import FiatOwnPriceInput from './components/FiatOwnPriceInput'
import PriceInfo from './components/PriceInfo'

function SetYourOwnPrice(): JSX.Element {
  return (
    <Stack space="$4">
      <Stack space="$2">
        <BtcOwnPriceInput />
        <FiatOwnPriceInput />
      </Stack>
      <PriceInfo />
    </Stack>
  )
}

export default SetYourOwnPrice

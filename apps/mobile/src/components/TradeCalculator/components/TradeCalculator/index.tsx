import {useAtomValue, useSetAtom} from 'jotai'
import {Stack, XStack} from 'tamagui'
import CurrentBtcPrice from '../../../CurrentBtcPrice'
import {
  btcInputValueAtom,
  btcPriceCurrencyAtom,
  calculateBtcValueAfterBtcPriceRefreshActionAtom,
  fiatInputValueAtom,
  tradeBtcPriceAtom,
  tradePriceTypeAtom,
  tradePriceTypeDialogVisibleAtom,
} from '../../atoms'
import BtcAmountInput from './components/BtcAmountInput'
import FiatAmountInput from './components/FiatAmountInput'
import PremiumOrDiscount from './components/PremiumOrDiscount'
import SwitchTradePriceTypeButton from './components/SwitchTradePriceTypeButton'

interface Props {
  children?: React.ReactNode
  onPremiumOrDiscountPress: () => void
}

function TradeCalculator({
  children,
  onPremiumOrDiscountPress,
}: Props): JSX.Element {
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const setTradePriceTypeDialogVisible = useSetAtom(
    tradePriceTypeDialogVisibleAtom
  )
  const calculateBtcValueAfterBtcPriceRefresh = useSetAtom(
    calculateBtcValueAfterBtcPriceRefreshActionAtom
  )

  return (
    <Stack space="$4">
      <XStack ai="center" jc="space-between">
        <SwitchTradePriceTypeButton
          onPress={() => {
            setTradePriceTypeDialogVisible(true)
          }}
        />
        <CurrentBtcPrice
          disabled={tradePriceType !== 'live'}
          currencyAtom={btcPriceCurrencyAtom}
          customBtcPriceAtom={
            tradePriceType !== 'live' ? tradeBtcPriceAtom : undefined
          }
          postRefreshActions={calculateBtcValueAfterBtcPriceRefresh}
        />
      </XStack>
      {tradePriceType === 'custom' && children}
      <Stack space="$2">
        <BtcAmountInput btcValueAtom={btcInputValueAtom} />
        <FiatAmountInput showSubtitle fiatValueAtom={fiatInputValueAtom} />
      </Stack>
      <PremiumOrDiscount onPremiumOrDiscountPress={onPremiumOrDiscountPress} />
    </Stack>
  )
}

export default TradeCalculator
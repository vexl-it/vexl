import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {Stack, XStack} from 'tamagui'
import CurrentBtcPrice from '../../../CurrentBtcPrice'
import {
  btcInputValueAtom,
  btcPriceCurrencyAtom,
  calculateFiatValueAfterBtcPriceRefreshActionAtom,
  currencySelectVisibleAtom,
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
}: Props): React.ReactElement {
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const setTradePriceTypeDialogVisible = useSetAtom(
    tradePriceTypeDialogVisibleAtom
  )
  const calculateFiatValueAfterBtcPriceRefresh = useSetAtom(
    calculateFiatValueAfterBtcPriceRefreshActionAtom
  )

  return (
    <Stack gap="$4">
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
          postRefreshActions={calculateFiatValueAfterBtcPriceRefresh}
        />
      </XStack>
      {tradePriceType === 'custom' && children}
      <Stack gap="$2">
        <BtcAmountInput btcValueAtom={btcInputValueAtom} />
        <FiatAmountInput
          showPremiumInfoMessage
          currencySelectVisibleAtom={currencySelectVisibleAtom}
          fiatValueAtom={fiatInputValueAtom}
        />
      </Stack>
      <PremiumOrDiscount onPremiumOrDiscountPress={onPremiumOrDiscountPress} />
    </Stack>
  )
}

export default TradeCalculator

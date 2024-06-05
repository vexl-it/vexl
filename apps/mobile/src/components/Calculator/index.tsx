import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  type BtcOrSat,
  type TradePriceType,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {
  useAtomValue,
  useSetAtom,
  type PrimitiveAtom,
  type WritableAtom,
} from 'jotai'
import React from 'react'
import {Stack, XStack} from 'tamagui'
import CurrentBtcPrice from '../CurrentBtcPrice'
import BtcAmountInput from './components/BtcAmountInput'
import FiatAmountInput from './components/FiatAmountInput'
import PremiumOrDiscount from './components/PremiumOrDiscount'
import SwitchTradePriceTypeButton from './components/SwitchTradePriceTypeButton'

interface Props {
  children?: React.ReactNode
  feeAmountAtom: PrimitiveAtom<number>
  togglePremiumOrDiscountActionAtom: WritableAtom<boolean, [], void>
  applyFeeOnFeeChangeActionAtom: WritableAtom<null, [feeAmount: number], void>
  tradePriceTypeAtom: PrimitiveAtom<TradePriceType | undefined>
  btcPriceCurrencyAtom: WritableAtom<CurrencyCode, [value: CurrencyCode], void>
  btcInputValueAtom: PrimitiveAtom<string>
  fiatInputValueAtom: PrimitiveAtom<string>
  tradeBtcPriceAtom: PrimitiveAtom<number>
  btcOrSatsValueActionAtom: WritableAtom<BtcOrSat, [value: BtcOrSat], void>
  tradePriceTypeDialogVisibleAtom: PrimitiveAtom<boolean>
}

function TradeCalculator({
  children,
  feeAmountAtom,
  togglePremiumOrDiscountActionAtom,
  applyFeeOnFeeChangeActionAtom,
  tradePriceTypeAtom,
  btcPriceCurrencyAtom,
  btcInputValueAtom,
  fiatInputValueAtom,
  tradeBtcPriceAtom,
  btcOrSatsValueActionAtom,
  tradePriceTypeDialogVisibleAtom,
}: Props): JSX.Element {
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const setTradePriceTypeDialogVisible = useSetAtom(
    tradePriceTypeDialogVisibleAtom
  )

  return (
    <Stack space="$4">
      <XStack ai="center" jc="space-between">
        <SwitchTradePriceTypeButton
          tradePriceTypeAtom={tradePriceTypeAtom}
          onPress={() => {
            setTradePriceTypeDialogVisible(true)
          }}
        />
        <CurrentBtcPrice
          currencyAtom={btcPriceCurrencyAtom}
          customBtcPriceAtom={
            tradePriceType === 'your' ? tradeBtcPriceAtom : undefined
          }
          postRefreshActions={calculateBtcValueAfterBtcPriceRefresh}
        />
      </XStack>
      {tradePriceType === 'custom' && {children}}
      <Stack space="$2">
        <BtcAmountInput
          btcValueAtom={btcInputValueAtom}
          btcOrSatsValueActionAtom={btcOrSatsValueActionAtom}
        />
        <FiatAmountInput showSubtitle fiatValueAtom={fiatInputValueAtom} />
      </Stack>
      <PremiumOrDiscount
        feeAmountAtom={feeAmountAtom}
        togglePremiumOrDiscountActionAtom={togglePremiumOrDiscountActionAtom}
        applyFeeOnFeeChangeActionAtom={applyFeeOnFeeChangeActionAtom}
      />
    </Stack>
  )
}

export default TradeCalculator

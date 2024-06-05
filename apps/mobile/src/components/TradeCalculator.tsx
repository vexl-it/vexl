import { Stack, XStack } from "tamagui"
import CurrentBtcPrice from "./CurrentBtcPrice"

function TradeCalculator(): JSX.Element {
  return (
    <Stack space="$4">
    <XStack ai="center" jc="space-between">
      <SwitchTradePriceTypeButton
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
      <BtcAmountInput btcValueAtom={btcInputValueAtom} />
      <FiatAmountInput showSubtitle fiatValueAtom={fiatInputValueAtom} />
    </Stack>
    <PremiumOrDiscount />
  </Stack>
  )
}

export default TradeCalculator

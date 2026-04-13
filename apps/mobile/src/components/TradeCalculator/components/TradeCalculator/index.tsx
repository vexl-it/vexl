import {useNavigation} from '@react-navigation/native'
import {Exchange} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {Stack, XStack} from 'tamagui'
import {type TradeCalculatorStackScreenProps} from '../../../../navigationTypes'
import {getCurrentLocale} from '../../../../utils/localization/I18nProvider'
import {ChangeCurrency} from '../../../ChangeCurrency'
import CurrentBtcPrice from '../../../CurrentBtcPrice'
import {
  amountInputsSwappedAtom,
  btcInputValueAtom,
  btcOrSatAtom,
  btcPriceCurrencyAtom,
  calculateBtcValueOnFiatAmountChangeActionAtom,
  calculateFiatValueAfterBtcPriceRefreshActionAtom,
  calculateFiatValueOnBtcAmountChangeActionAtom,
  currencySelectVisibleAtom,
  fiatInputValueAtom,
  selectedCurrencyCodeForOwnPriceAtom,
  switchBtcOrSatValueActionAtom,
  tradeBtcPriceAtom,
  tradePriceTypeAtom,
  updateFiatCurrencyActionAtom,
} from '../../atoms'
import CalculatedWithLiveRate from './components/CalculatedWithLiveRate'
import PremiumIncluded from './components/PremiumIncluded'
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
  const navigation =
    useNavigation<
      TradeCalculatorStackScreenProps<'TradeCalculator'>['navigation']
    >()
  const amountInputsSwapped = useAtomValue(amountInputsSwappedAtom)
  const btcOrSat = useAtomValue(btcOrSatAtom)
  const btcInputValue = useAtomValue(btcInputValueAtom)
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const fiatCurrencyAtom =
    tradePriceType === 'your'
      ? selectedCurrencyCodeForOwnPriceAtom
      : btcPriceCurrencyAtom
  const fiatCurrency = useAtomValue(fiatCurrencyAtom)
  const fiatInputValue = useAtomValue(fiatInputValueAtom)
  const calculateFiatValueAfterBtcPriceRefresh = useSetAtom(
    calculateFiatValueAfterBtcPriceRefreshActionAtom
  )
  const calculateBtcValueOnFiatAmountChange = useSetAtom(
    calculateBtcValueOnFiatAmountChangeActionAtom
  )
  const calculateFiatValueOnBtcAmountChange = useSetAtom(
    calculateFiatValueOnBtcAmountChangeActionAtom
  )
  const setCurrencySelectVisible = useSetAtom(currencySelectVisibleAtom)
  const setAmountInputsSwapped = useSetAtom(amountInputsSwappedAtom)
  const switchBtcOrSatValue = useSetAtom(switchBtcOrSatValueActionAtom)
  const updateFiatCurrency = useSetAtom(updateFiatCurrencyActionAtom)
  const locale = getCurrentLocale()

  return (
    <Stack gap="$4">
      <XStack ai="flex-start" jc="space-between" gap="$4">
        <SwitchTradePriceTypeButton
          onPress={() => {
            navigation.navigate('TradePriceType')
          }}
        />
        <CurrentBtcPrice
          disabled={tradePriceType !== 'live'}
          currencyAtom={btcPriceCurrencyAtom}
          customBtcPriceAtom={
            tradePriceType !== 'live' ? tradeBtcPriceAtom : undefined
          }
          postRefreshActions={calculateFiatValueAfterBtcPriceRefresh}
          showLastUpdatedAt={false}
          col="$foregroundSecondary"
          fos={12}
          textAlign="right"
        />
      </XStack>
      {tradePriceType === 'custom' && children}
      <Stack gap="$2">
        <Exchange
          btcValue={btcInputValue}
          btcUnit={btcOrSat === 'SAT' ? 'SATS' : 'BTC'}
          onBtcValueChange={(value) => {
            calculateFiatValueOnBtcAmountChange({btcAmount: value})
          }}
          onBtcUnitChange={() => {}}
          onToggleBtcUnit={() => {
            switchBtcOrSatValue()
          }}
          fiatValue={fiatInputValue}
          fiatCurrency={fiatCurrency ?? 'USD'}
          onFiatValueChange={(value) => {
            calculateBtcValueOnFiatAmountChange({fiatAmount: value})
          }}
          onFiatCurrencyPress={() => {
            setCurrencySelectVisible(true)
          }}
          locale={locale}
          swapped={amountInputsSwapped}
          onSwapPress={() => {
            setAmountInputsSwapped((previous) => !previous)
          }}
        />
        <CalculatedWithLiveRate />
        <PremiumIncluded />
      </Stack>
      <ChangeCurrency
        selectedCurrencyCodeAtom={fiatCurrencyAtom}
        onSave={updateFiatCurrency}
        visibleAtom={currencySelectVisibleAtom}
      />
      <PremiumOrDiscount onPremiumOrDiscountPress={onPremiumOrDiscountPress} />
    </Stack>
  )
}

export default TradeCalculator

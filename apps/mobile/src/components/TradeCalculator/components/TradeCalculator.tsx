import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {Stack, XStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import BtcAmountInput from '../../Calculator/components/BtcAmountInput'
import FiatAmountInput from '../../Calculator/components/FiatAmountInput'
import PremiumOrDiscount from '../../Calculator/components/PremiumOrDiscount'
import SwitchTradePriceTypeButton from '../../Calculator/components/SwitchTradePriceTypeButton'
import CurrentBtcPrice from '../../CurrentBtcPrice'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../PageWithNavigationHeader'
import {tradeCalculatorMolecule} from '../atoms'

interface Props {
  children?: React.ReactNode
}

function TradeCalculator({children}: Props): JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()

  const {
    // btcPriceForOfferWithStateAtom,
    calculateBtcValueAfterBtcPriceRefreshActionAtom,
    tradePriceTypeAtom,
    btcPriceCurrencyAtom,
    tradePriceTypeDialogVisibleAtom,
    btcInputValueAtom,
    fiatInputValueAtom,
    tradeBtcPriceAtom,
  } = useMolecule(tradeCalculatorMolecule)

  // const btcPriceForOfferWithState = useAtomValue(btcPriceForOfferWithStateAtom)
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  const setTradePriceTypeDialogVisible = useSetAtom(
    tradePriceTypeDialogVisibleAtom
  )

  const calculateBtcValueAfterBtcPriceRefresh = useSetAtom(
    calculateBtcValueAfterBtcPriceRefreshActionAtom
  )

  // const btcPricePercentageDifference = useMemo(() => {
  //   if (tradePriceType === 'custom' && amountData?.btcPrice)
  //     return calculatePercentageDifference(
  //       amountData.btcPrice,
  //       btcPriceForOfferWithState?.btcPrice
  //     )

  //   return 0
  // }, [amountData?.btcPrice, btcPriceForOfferWithState, tradePriceType])

  return (
    <>
      <HeaderProxy title={t('tradeCalculator.title')} onClose={safeGoBack} />
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
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy
        onPress={() => {
          // safeGoBack()
        }}
        text={t('common.save')}
      />
    </>
  )
}

export default TradeCalculator

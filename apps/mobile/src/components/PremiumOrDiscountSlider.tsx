import {BuySellRangeSlider} from '@vexl-next/ui'
import React from 'react'
import {useTranslation} from '../utils/localization/I18nProvider'
import {
  formatPremiumOrDiscount,
  getInfoText,
  SLIDER_THRESHOLD,
} from '../utils/premiumOrDiscount'

interface Props {
  readonly feeAmount: number
  readonly onFeeAmountChange: (feeAmount: number) => void
  readonly isBuy: boolean
  readonly amountText?: string
}

function PremiumOrDiscountSlider({
  feeAmount,
  onFeeAmountChange,
  isBuy,
  amountText,
}: Props): React.JSX.Element {
  const {t} = useTranslation()

  return (
    <BuySellRangeSlider
      title={
        isBuy
          ? t('offerForm.premiumOrDiscount.youBuyBtcFor')
          : t('offerForm.premiumOrDiscount.youSellBtcFor')
      }
      valueLabel={formatPremiumOrDiscount(feeAmount, t)}
      leftLabel={
        isBuy
          ? t('offerForm.premiumOrDiscount.buyCheaply')
          : t('offerForm.premiumOrDiscount.sellFaster')
      }
      rightLabel={
        isBuy
          ? t('offerForm.premiumOrDiscount.buyFaster')
          : t('offerForm.premiumOrDiscount.earnMore')
      }
      minPercentage={-SLIDER_THRESHOLD}
      maxPercentage={SLIDER_THRESHOLD}
      percentage={feeAmount}
      onPercentageChange={onFeeAmountChange}
      infoText={getInfoText(feeAmount, isBuy, t)}
      amountText={amountText}
    />
  )
}

export default PremiumOrDiscountSlider

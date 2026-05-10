import {type TFunction} from './localization/I18nProvider'

export const SLIDER_THRESHOLD = 10

export function getInfoText(
  feeAmount: number,
  isBuy: boolean,
  t: TFunction
): string {
  const halfThreshold = SLIDER_THRESHOLD / 2

  if (isBuy) {
    if (feeAmount === 0)
      return t('offerForm.premiumOrDiscount.youBuyForTheActualMarketPrice')
    if (feeAmount > 0) {
      if (feeAmount <= halfThreshold)
        return t('offerForm.premiumOrDiscount.theOptimalPositionForMostPeople')
      return t('offerForm.premiumOrDiscount.youBuyReallyFast')
    }
    if (Math.abs(feeAmount) <= halfThreshold)
      return t('offerForm.premiumOrDiscount.youBuyPrettyCheap')
    return t('offerForm.premiumOrDiscount.youBuyVeryCheaply')
  }

  if (feeAmount === 0)
    return t('offerForm.premiumOrDiscount.slider.sellingAtMarketPrice')
  if (feeAmount > 0) {
    if (feeAmount <= halfThreshold)
      return t('offerForm.premiumOrDiscount.slider.earnBitMore')
    return t('offerForm.premiumOrDiscount.slider.earnMuchMore')
  }
  if (Math.abs(feeAmount) <= halfThreshold)
    return t('offerForm.premiumOrDiscount.slider.sellSlightlyFaster')
  return t('offerForm.premiumOrDiscount.slider.sellMuchFaster')
}

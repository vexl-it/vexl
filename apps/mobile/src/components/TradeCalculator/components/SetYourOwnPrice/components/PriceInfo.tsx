import {useAtomValue} from 'jotai'
import React from 'react'
import calculatePercentageDifference from '../../../../../utils/calculatePercentageDifference'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../../../utils/localization/I18nProvider'
import Info from '../../../../Info'
import {btcPriceForOfferWithStateAtom, ownPriceAtom} from '../../../atoms'

function PriceInfo(): React.ReactElement | null {
  const {t} = useTranslation()
  const locale = getCurrentLocale()

  const ownPrice = Number(useAtomValue(ownPriceAtom)) ?? 0
  const btcPriceForOfferWithState = useAtomValue(btcPriceForOfferWithStateAtom)

  const percentageDifference = calculatePercentageDifference(
    ownPrice,
    btcPriceForOfferWithState?.btcPrice?.BTC
  )

  return ownPrice > 0 && percentageDifference !== 0 ? (
    <Info
      variant="yellow"
      hideCloseButton
      text={t(
        percentageDifference >= 0
          ? 'tradeChecklist.setYourOwnPrice.yourProposedBtcPriceIsHigher'
          : 'tradeChecklist.setYourOwnPrice.yourProposedBtcPriceIsLower',
        {
          percentage: Math.abs(Number(percentageDifference)).toLocaleString(
            locale,
            {maximumFractionDigits: 2}
          ),
        }
      )}
    />
  ) : null
}

export default PriceInfo

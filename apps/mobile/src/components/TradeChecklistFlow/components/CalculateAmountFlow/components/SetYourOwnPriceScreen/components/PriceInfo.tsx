import Info from '../../../../../../Info'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../../../../../utils/localization/I18nProvider'
import {type PrimitiveAtom, useAtomValue} from 'jotai'
import calculatePercentageDifference from '../../../../../../../utils/calculatePercentageDifference'
import {btcPriceForOfferWithStateAtom} from '../../../../../atoms/btcPriceForOfferWithStateAtom'

interface Props {
  fiatTempValueAtom: PrimitiveAtom<string>
}

function PriceInfo({fiatTempValueAtom}: Props): JSX.Element | null {
  const {t} = useTranslation()
  const locale = getCurrentLocale()
  const fiatTempValue = Number(useAtomValue(fiatTempValueAtom)) ?? 0
  const btcPriceForOfferWithState = useAtomValue(btcPriceForOfferWithStateAtom)

  const percentageDifference = calculatePercentageDifference(
    fiatTempValue,
    btcPriceForOfferWithState?.btcPrice
  )

  return fiatTempValue && fiatTempValue > 0 && percentageDifference !== 0 ? (
    <Info
      variant={'yellow'}
      hideCloseButton
      text={t(
        percentageDifference >= 0
          ? 'tradeChecklist.setYourOwnPrice.ourNewBtcPriceIsHigher'
          : 'tradeChecklist.setYourOwnPrice.ourNewBtcPriceIsLower',
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

import Info from '../../../../../../Info'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../../../../../utils/localization/I18nProvider'
import {type PrimitiveAtom, useAtomValue} from 'jotai'
import calculatePercentageDifference from '../../../../../../../utils/calculatePercentageDifference'
import {currentBtcPriceAtom} from '../../../../../../../state/currentBtcPriceAtoms'

interface Props {
  fiatTempValueAtom: PrimitiveAtom<string>
}

function PriceInfo({fiatTempValueAtom}: Props): JSX.Element | null {
  const {t} = useTranslation()
  const locale = getCurrentLocale()
  const fiatTempValue = Number(useAtomValue(fiatTempValueAtom)) ?? 0
  const currentBtcPrice = useAtomValue(currentBtcPriceAtom)

  const percentageDifference = calculatePercentageDifference(
    fiatTempValue,
    currentBtcPrice ?? 0
  )

  return fiatTempValue && fiatTempValue > 0 && percentageDifference !== 0 ? (
    <Info
      variant={'yellow'}
      hideCloseButton
      text={t(
        percentageDifference > 0
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

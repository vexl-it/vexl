import Info from '../../../../../../Info'
import {
  getCurrentLocale,
  useTranslation,
} from '../../../../../../../utils/localization/I18nProvider'
import {tradeBtcPriceAtom} from '../../../atoms'
import {type PrimitiveAtom, useAtomValue} from 'jotai'
import {useMemo} from 'react'

interface Props {
  fiatTempValueAtom: PrimitiveAtom<string>
}

function PriceInfo({fiatTempValueAtom}: Props): JSX.Element | null {
  const {t} = useTranslation()
  const locale = getCurrentLocale()
  const tradeBtcPrice = useAtomValue(tradeBtcPriceAtom)
  const fiatTempValue = Number(useAtomValue(fiatTempValueAtom)) ?? 0

  const percentageDifference = useMemo(
    () => 100 - (fiatTempValue / tradeBtcPrice) * 100,
    [fiatTempValue, tradeBtcPrice]
  )

  return fiatTempValue && fiatTempValue > 0 && percentageDifference !== 0 ? (
    <Info
      variant={'yellow'}
      hideCloseButton
      text={t(
        percentageDifference < 0
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

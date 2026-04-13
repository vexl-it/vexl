import {Typography} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {tradePriceTypeAtom} from '../../../atoms'

function CalculatedWithLiveRate(): React.ReactElement | null {
  const {t} = useTranslation()
  const tradePriceType = useAtomValue(tradePriceTypeAtom)

  return tradePriceType === 'live' ? (
    <Typography variant="micro" color="$foregroundSecondary" numberOfLines={2}>
      {t('tradeChecklist.calculateAmount.calculatedWithLiveRate')}
    </Typography>
  ) : null
}

export default CalculatedWithLiveRate

import {type OfferType} from '@vexl-next/domain/src/general/offers'
import {useMemo} from 'react'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {type TabProps} from '../../../Tabs'

export default function useContent(): Array<TabProps<OfferType>> {
  const {t} = useTranslation()

  return useMemo(
    () => [
      {
        title: t('offerForm.sellBitcoin'),
        type: 'SELL',
      },
      {
        title: t('offerForm.buyBitcoin'),
        type: 'BUY',
      },
    ],
    [t]
  )
}

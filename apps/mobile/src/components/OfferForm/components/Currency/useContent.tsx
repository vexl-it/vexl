import {type Currency} from '@vexl-next/domain/dist/general/offers'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {type TabProps} from '../../../Tabs'
import {useMemo} from 'react'

export default function useContent(): Array<TabProps<Currency>> {
  const {t} = useTranslation()

  return useMemo(
    () => [
      {
        title: t('offerForm.czk'),
        type: 'CZK',
      },
      {
        title: t('offerForm.eur'),
        type: 'EUR',
      },
      {
        title: t('offerForm.usd'),
        type: 'USD',
      },
    ],
    [t]
  )
}

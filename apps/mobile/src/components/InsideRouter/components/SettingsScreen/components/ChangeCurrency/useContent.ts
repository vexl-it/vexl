import {type Currency} from '@vexl-next/domain/dist/general/offers'

import {useMemo} from 'react'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'

export default function useContent(): Array<{
  title: string
  currency: Currency
}> {
  const {t} = useTranslation()

  return useMemo(
    () => [
      {
        title: t('currency.czechCrown'),
        currency: 'CZK',
      },
      {
        title: t('currency.euro'),
        currency: 'EUR',
      },
      {
        title: t('currency.unitedStatesDollar'),
        currency: 'USD',
      },
    ],
    [t]
  )
}

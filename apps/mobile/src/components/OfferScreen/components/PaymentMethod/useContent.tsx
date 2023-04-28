import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {type SelectableCellContentProps} from '../SelectableCell'
import {
  type PaymentMethod,
  LocationState,
} from '@vexl-next/domain/dist/general/offers'
import {useMemo} from 'react'

export default function useContent(): Record<
  LocationState,
  Array<SelectableCellContentProps<PaymentMethod>>
> {
  const {t} = useTranslation()

  return useMemo(
    () => ({
      [LocationState.enum.IN_PERSON]: [
        {
          title: t('createOffer.paymentMethod.cash'),
          type: 'CASH',
        },
      ],
      [LocationState.enum.ONLINE]: [
        {
          title: t('createOffer.paymentMethod.bank'),
          type: 'BANK',
        },
        {
          title: t('createOffer.paymentMethod.revolut'),
          type: 'REVOLUT',
        },
      ],
    }),
    [t]
  )
}

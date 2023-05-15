import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {
  type PaymentMethod,
  LocationState,
} from '@vexl-next/domain/dist/general/offers'
import {useMemo} from 'react'
import {type SelectableCellContentProps} from '../../../SelectableCell'

export default function useContent(): Record<
  LocationState,
  Array<SelectableCellContentProps<PaymentMethod>>
> {
  const {t} = useTranslation()

  return useMemo(
    () => ({
      [LocationState.enum.IN_PERSON]: [
        {
          title: t('offerForm.paymentMethod.cash'),
          type: 'CASH',
        },
      ],
      [LocationState.enum.ONLINE]: [
        {
          title: t('offerForm.paymentMethod.bank'),
          type: 'BANK',
        },
        {
          title: t('offerForm.paymentMethod.revolut'),
          type: 'REVOLUT',
        },
      ],
    }),
    [t]
  )
}

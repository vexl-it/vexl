import {
  type LocationState,
  type PaymentMethod,
} from '@vexl-next/domain/src/general/offers'
import {useMemo} from 'react'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {type SelectableCellContentProps} from '../../../SelectableCell'

export default function useContent(): Record<
  LocationState,
  Array<SelectableCellContentProps<PaymentMethod>>
> {
  const {t} = useTranslation()

  return useMemo(
    () => ({
      IN_PERSON: [
        {
          title: t('offerForm.paymentMethod.cash'),
          type: 'CASH',
        },
      ],
      ONLINE: [
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

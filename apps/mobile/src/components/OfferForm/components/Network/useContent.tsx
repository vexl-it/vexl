import {type BtcNetwork} from '@vexl-next/domain/src/general/offers'
import {useMemo} from 'react'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {type SelectableCellContentProps} from '../../../SelectableCell'

export default function useContent(): Array<
  SelectableCellContentProps<BtcNetwork>
> {
  const {t} = useTranslation()

  return useMemo(
    () => [
      {
        title: t('offerForm.network.lightning'),
        subtitle: t('offerForm.network.theBestOption'),
        type: 'LIGHTING',
      },
      {
        title: t('offerForm.network.onChain'),
        subtitle: t('offerForm.network.theBestFor'),
        type: 'ON_CHAIN',
      },
    ],
    [t]
  )
}

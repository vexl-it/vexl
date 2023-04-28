import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {type SelectableCellContentProps} from '../SelectableCell'
import {type BtcNetwork} from '@vexl-next/domain/dist/general/offers'
import {useMemo} from 'react'

export default function useContent(): Array<
  SelectableCellContentProps<BtcNetwork>
> {
  const {t} = useTranslation()

  return useMemo(
    () => [
      {
        title: t('createOffer.network.lightning'),
        subtitle: t('createOffer.network.theBestOption'),
        type: 'LIGHTING',
      },
      {
        title: t('createOffer.network.onChain'),
        subtitle: t('createOffer.network.theBestFor'),
        type: 'ON_CHAIN',
      },
    ],
    [t]
  )
}

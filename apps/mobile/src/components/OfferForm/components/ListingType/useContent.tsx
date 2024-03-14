import {type ListingType} from '@vexl-next/domain/src/general/offers'
import {useMemo} from 'react'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {type TabProps} from '../../../Tabs'

export default function useContent(): Array<TabProps<ListingType>> {
  const {t} = useTranslation()

  return useMemo(
    () => [
      {
        title: t('offerForm.BITCOIN'),
        type: 'BITCOIN' as ListingType,
      },
      {
        title: t('offerForm.PRODUCT'),
        type: 'PRODUCT' as ListingType,
      },
      {
        title: t('offerForm.OTHER'),
        type: 'OTHER' as ListingType,
      },
    ],
    [t]
  )
}

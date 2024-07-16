import {type ListingType} from '@vexl-next/domain/src/general/offers'
import {useMemo} from 'react'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {type TabProps} from '../../../Tabs'

export default function useContent(): Array<TabProps<ListingType>> {
  const {t} = useTranslation()

  return useMemo(
    () => [
      {
        testID: '@listingType/bitcoin',
        title: t('offerForm.BITCOIN'),
        type: 'BITCOIN' as const,
      },
      {
        testID: '@listingType/product',
        title: t('offerForm.PRODUCT'),
        type: 'PRODUCT' as const,
      },
      {
        testID: '@listingType/other',
        title: t('offerForm.OTHER'),
        type: 'OTHER' as const,
      },
    ],
    [t]
  )
}

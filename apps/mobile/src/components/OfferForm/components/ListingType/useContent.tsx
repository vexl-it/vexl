import {type ListingType} from '@vexl-next/domain/src/general/offers'
import {useAtomValue} from 'jotai'
import {useMemo} from 'react'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {preferencesAtom} from '../../../../utils/preferences'
import {type TabProps} from '../../../Tabs'

export default function useContent(): Array<TabProps<ListingType>> {
  const {t} = useTranslation()
  const preferences = useAtomValue(preferencesAtom)

  return useMemo(() => {
    const listingTypes = [
      {
        title: t('offerForm.BITCOIN'),
        type: 'BITCOIN' as ListingType,
      },
      {
        title: t('offerForm.PRODUCT'),
        type: 'PRODUCT' as ListingType,
      },
    ]

    if (!preferences.hideOtherListingType) {
      listingTypes.push({
        title: t('offerForm.OTHER'),
        type: 'OTHER' as ListingType,
      })
    }

    return listingTypes
  }, [preferences.hideOtherListingType, t])
}

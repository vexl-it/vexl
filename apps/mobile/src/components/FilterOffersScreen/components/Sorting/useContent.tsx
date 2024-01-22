import {type Sort} from '@vexl-next/domain/src/general/offers'
import {useMemo} from 'react'
import {useTranslation} from '../../../../utils/localization/I18nProvider'

interface SortingProps {
  title: string
  sortingType: Sort
}

export default function useContent(): SortingProps[] {
  const {t} = useTranslation()

  return useMemo(
    () => [
      {
        title: t('filterOffers.lowestFeeFirst'),
        sortingType: 'LOWEST_FEE_FIRST',
      },
      {
        title: t('filterOffers.highestFee'),
        sortingType: 'HIGHEST_FEE',
      },
      {
        title: t('filterOffers.newestOffer'),
        sortingType: 'NEWEST_OFFER',
      },
      {
        title: t('filterOffers.oldestOffer'),
        sortingType: 'OLDEST_OFFER',
      },
      {
        title: t('filterOffers.lowestAmount'),
        sortingType: 'LOWEST_AMOUNT',
      },
      {
        title: t('filterOffers.highestAmount'),
        sortingType: 'HIGHEST_AMOUNT',
      },
    ],
    [t]
  )
}

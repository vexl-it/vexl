import {type TabItem} from '@vexl-next/ui'
import {useMemo} from 'react'
import {useTranslation} from '../../../../utils/localization/I18nProvider'

export type MarketplaceTab = 'allOffers' | 'myOffers'

export function useMarketplaceTabs(): ReadonlyArray<TabItem<MarketplaceTab>> {
  const {t} = useTranslation()
  return useMemo(
    () => [
      {label: t('common.allOffers'), value: 'allOffers'},
      {label: t('common.myOffers'), value: 'myOffers'},
    ],
    [t]
  )
}

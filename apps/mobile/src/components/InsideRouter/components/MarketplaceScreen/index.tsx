import {type TabItem} from '@vexl-next/ui'
import React, {useMemo, useState} from 'react'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {InsideScreen} from '../InsideScreen'
import MarketplaceScreenContent from './components/MarketplaceScreenContent'

export type MarketplaceTab = 'allOffers' | 'myOffers'

function useTabs(): ReadonlyArray<TabItem<MarketplaceTab>> {
  const {t} = useTranslation()
  return useMemo(
    () => [
      {label: t('common.allOffers'), value: 'allOffers'},
      {label: t('common.myOffers'), value: 'myOffers'},
    ],
    [t]
  )
}

function MarketplaceScreen(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<MarketplaceTab>('allOffers')
  const tabs = useTabs()
  const title = tabs.find((tab) => tab.value === activeTab)?.label ?? ''

  return (
    <InsideScreen title={title}>
      <MarketplaceScreenContent
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
      />
    </InsideScreen>
  )
}

export default MarketplaceScreen

import {useNavigation, useRoute} from '@react-navigation/native'
import {FabButton, PlusAdd} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React, {useCallback, useLayoutEffect, useState} from 'react'
import {type InsideTabParamsList} from '../../../../navigationTypes'
import {areThereAnyMyOffersAtom} from '../../../../state/marketplace/atoms/myOffers'
import {areThereOffersToSeeInMarketplaceWithoutFiltersAtom} from '../../../../state/marketplace/atoms/offersToSeeInMarketplace'
import {newOfferButtonVisibleOnLoadingMarketplaceAtom} from '../../../../state/marketplace/atoms/shouldShowLoadingOffersAtom'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {InsideScreen} from '../InsideScreen'
import MarketplaceScreenContent from './components/MarketplaceScreenContent'
import {type MarketplaceTab, useMarketplaceTabs} from './useMarketplaceTabs'

function NewOfferFab({
  activeTab,
}: {
  activeTab: MarketplaceTab
}): React.JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const areThereOffersFromOthers = useAtomValue(
    areThereOffersToSeeInMarketplaceWithoutFiltersAtom
  )
  const areThereMyOffers = useAtomValue(areThereAnyMyOffersAtom)
  const newOfferButtonVisibleOnLoadingMarketplace = useAtomValue(
    newOfferButtonVisibleOnLoadingMarketplaceAtom
  )
  const showFab =
    activeTab === 'allOffers'
      ? areThereOffersFromOthers || newOfferButtonVisibleOnLoadingMarketplace
      : areThereMyOffers

  const navigateToNewOffer = useCallback(() => {
    navigation.navigate('CRUDOfferFlow')
  }, [navigation])

  if (!showFab) return null

  return (
    <FabButton
      floating
      zIndex={2}
      icon={PlusAdd}
      label={t('offerForm.myNewOffer')}
      onPress={navigateToNewOffer}
    />
  )
}

function MarketplaceScreen(): React.ReactElement {
  const route = useRoute<{
    key: string
    name: 'Marketplace'
    params?: InsideTabParamsList['Marketplace']
  }>()
  const [activeTab, setActiveTab] = useState<MarketplaceTab>(
    route.params?.initialTab ?? 'allOffers'
  )
  const tabs = useMarketplaceTabs()
  const title = tabs.find((tab) => tab.value === activeTab)?.label ?? ''

  useLayoutEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab)
    }
  }, [route.params?.initialTab, route.params?.tabSwitchRequestId])

  return (
    <InsideScreen title={title}>
      <MarketplaceScreenContent
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        scrollToTopRequestId={route.params?.tabSwitchRequestId}
      />
      <NewOfferFab activeTab={activeTab} />
    </InsideScreen>
  )
}

export default MarketplaceScreen

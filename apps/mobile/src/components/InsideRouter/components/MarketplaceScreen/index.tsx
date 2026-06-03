import {useNavigation, useRoute} from '@react-navigation/native'
import {FabButton, PlusAdd, type TabItem} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Stack, useTheme} from 'tamagui'
import {type InsideTabParamsList} from '../../../../navigationTypes'
import {areThereAnyMyOffersAtom} from '../../../../state/marketplace/atoms/myOffers'
import {areThereOffersToSeeInMarketplaceWithoutFiltersAtom} from '../../../../state/marketplace/atoms/offersToSeeInMarketplace'
import {newOfferButtonVisibleOnLoadingMarketplaceAtom} from '../../../../state/marketplace/atoms/shouldShowLoadingOffersAtom'
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

function NewOfferFab({
  activeTab,
}: {
  activeTab: MarketplaceTab
}): React.JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const theme = useTheme()
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
    <Stack position="absolute" bottom="$4" right="$4" zIndex={2}>
      <FabButton
        icon={<PlusAdd size={24} color={theme.black100.get()} />}
        label={t('offerForm.myNewOffer')}
        onPress={navigateToNewOffer}
      />
    </Stack>
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
  const tabs = useTabs()
  const title = tabs.find((tab) => tab.value === activeTab)?.label ?? ''

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab)
    }
  }, [route.params?.initialTab, route.params?.tabSwitchRequestId])

  return (
    <InsideScreen title={title}>
      <MarketplaceScreenContent
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
      />
      <NewOfferFab activeTab={activeTab} />
    </InsideScreen>
  )
}

export default MarketplaceScreen

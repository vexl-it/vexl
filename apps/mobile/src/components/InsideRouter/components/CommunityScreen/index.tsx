import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs'
import {Tabs, type TabItem} from '@vexl-next/ui'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {getTokens} from 'tamagui'
import {type CommunityParamsList} from '../../../../navigationTypes'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {InsideScreen, InsideScreenListHeader} from '../InsideScreen'
import BlogScreen from './components/BlogScreen'
import BoardScreen from './components/BoardScreen'
import ClubsScreen from './components/ClubsScreen'
import DiscoverScreen from './components/DiscoverScreen'
import EventsScreen from './components/EventsScreen'

const Tab = createMaterialTopTabNavigator<CommunityParamsList>()
const TAB_CONTENT_PADDING_LEFT = getTokens().space.$5.val

function toCommunityTab(tab: string | undefined): keyof CommunityParamsList {
  switch (tab) {
    case 'Discover':
      return 'Discover'
    case 'Events':
      return 'Events'
    case 'Clubs':
      return 'Clubs'
    case 'Board':
      return 'Board'
    case 'Blog':
      return 'Blog'
    default:
      return 'Discover'
  }
}

function getCommunityTabTitle({
  tab,
  t,
}: {
  readonly tab: keyof CommunityParamsList
  readonly t: ReturnType<typeof useTranslation>['t']
}): string {
  switch (tab) {
    case 'Discover':
      return t('community.tabs.discover')
    case 'Events':
      return t('community.tabs.events')
    case 'Clubs':
      return t('community.tabs.clubs')
    case 'Board':
      return t('community.tabs.board')
    case 'Blog':
      return t('community.tabs.blog')
  }
}

function CommunityTabBar({
  onActiveTabChange,
  ...props
}: MaterialTopTabBarProps & {
  readonly onActiveTabChange: (tab: keyof CommunityParamsList) => void
}): React.JSX.Element {
  const {t} = useTranslation()
  const {navigation, state} = props
  const activeRoute = state.routes[state.index]
  const activeTab = toCommunityTab(activeRoute?.name)
  const [optimisticActiveTab, setOptimisticActiveTab] =
    useState<keyof CommunityParamsList>(activeTab)
  const handleTabPress = useCallback(
    (tab: keyof CommunityParamsList) => {
      setOptimisticActiveTab(tab)
      onActiveTabChange(tab)
      navigation.navigate(tab)
    },
    [navigation, onActiveTabChange]
  )
  const tabs: ReadonlyArray<TabItem<keyof CommunityParamsList>> = useMemo(
    () => [
      {label: t('community.tabs.discover'), value: 'Discover'},
      {label: t('community.tabs.events'), value: 'Events'},
      {label: t('community.tabs.clubs'), value: 'Clubs'},
      {label: t('community.tabs.board'), value: 'Board'},
      {label: t('community.tabs.blog'), value: 'Blog'},
    ],
    [t]
  )

  useEffect(() => {
    setOptimisticActiveTab(activeTab)
    onActiveTabChange(activeTab)
  }, [activeTab, onActiveTabChange])

  return (
    <InsideScreenListHeader>
      <Tabs
        tabs={tabs}
        activeTab={optimisticActiveTab}
        contentPaddingLeft={TAB_CONTENT_PADDING_LEFT}
        onTabPress={handleTabPress}
      />
    </InsideScreenListHeader>
  )
}

const MemoizedCommunityTabBar = React.memo(CommunityTabBar)

const CommunityTabsNavigator = React.memo(function CommunityTabsNavigator({
  onActiveTabChange,
}: {
  readonly onActiveTabChange: (tab: keyof CommunityParamsList) => void
}): React.JSX.Element {
  const renderTabBar = useCallback(
    (props: MaterialTopTabBarProps) => (
      <MemoizedCommunityTabBar
        {...props}
        onActiveTabChange={onActiveTabChange}
      />
    ),
    [onActiveTabChange]
  )

  return (
    <Tab.Navigator
      initialRouteName="Discover"
      backBehavior="none"
      tabBar={renderTabBar}
      screenOptions={{
        lazy: true,
        swipeEnabled: true,
      }}
    >
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Clubs" component={ClubsScreen} />
      <Tab.Screen name="Board" component={BoardScreen} />
      <Tab.Screen name="Blog" component={BlogScreen} />
    </Tab.Navigator>
  )
})

function CommunityScreen(): React.JSX.Element {
  const {t} = useTranslation()
  const [activeTab, setActiveTab] =
    useState<keyof CommunityParamsList>('Discover')
  const handleActiveTabChange = useCallback(
    (tab: keyof CommunityParamsList) => {
      setActiveTab((currentTab) => (currentTab === tab ? currentTab : tab))
    },
    []
  )

  return (
    <InsideScreen title={getCommunityTabTitle({tab: activeTab, t})}>
      <CommunityTabsNavigator onActiveTabChange={handleActiveTabChange} />
    </InsideScreen>
  )
}

export default CommunityScreen

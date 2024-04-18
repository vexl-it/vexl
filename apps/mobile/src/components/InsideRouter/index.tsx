import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import React from 'react'
import {type InsideTabParamsList} from '../../navigationTypes'
import MarketplaceScreen from './components/MarketplaceScreen'
import MessagesScreen from './components/MessagesScreen'
import MyOffersScreen from './components/MyOffersScreen'
import SettingsScreen from './components/SettingsScreen'
import TabBar from './components/TabBar'

const Tab = createBottomTabNavigator<InsideTabParamsList>()

const screenOptionsEmptyHeader = {
  header: () => null,
}

export default function InsideScreen(): JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={screenOptionsEmptyHeader}
      tabBar={(props) => <TabBar {...props} />}
      initialRouteName="Marketplace"
    >
      <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
      <Tab.Screen name="MyOffers" component={MyOffersScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}

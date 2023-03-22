import React from 'react'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {type HomeTabs} from '../../navigationTypes'
import MarketplaceScreen from './components/MarketplaceScreen'
import MessagesScreen from './components/MessagesScreen'
import SettingsScreen from './components/SettingsScreen'
import TabBar from './components/TabBar'
import BitcoinPriceChart, {
  CHART_HEIGHT_PX,
} from './components/BitcoinPriceChart'
import styled from '@emotion/native'
import {LinearGradient} from 'expo-linear-gradient'
import {CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING} from './components/ContainerWithTopBorderRadius'

const Tab = createBottomTabNavigator<HomeTabs>()

const BackgroundImageContainer = styled.View`
  background-color: black;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: ${String(
    CHART_HEIGHT_PX + CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING
  )}px;
`

const BackgroundImage = styled(LinearGradient)`
  width: 100%;
  height: 100%;
  opacity: 0.2;
`

function HomeTabs(): JSX.Element {
  return (
    <>
      <BackgroundImageContainer>
        <BackgroundImage colors={['rgba(252, 205, 108, 0)', '#FCCD6C']} />
      </BackgroundImageContainer>
      <Tab.Navigator
        screenOptions={{
          header: () => <BitcoinPriceChart />,
        }}
        tabBar={(props) => <TabBar {...props} />}
        initialRouteName="Marketplace"
      >
        <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
        <Tab.Screen name="Messages" component={MessagesScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </>
  )
}

export default HomeTabs

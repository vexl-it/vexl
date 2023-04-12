import React from 'react'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {type InsideTabParamsList} from '../../navigationTypes'
import MarketplaceScreen from './components/MarketplaceScreen'
import MessagesScreen from './components/MessagesScreen'
import SettingsScreen from './components/SettingsScreen'
import TabBar from './components/TabBar'
import BitcoinPriceChart, {
  CHART_HEIGHT_PX,
} from './components/BitcoinPriceChart'
import {LinearGradient} from 'expo-linear-gradient'
import {CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING} from './components/ContainerWithTopBorderRadius'
import {Stack, styled} from 'tamagui'

const Tab = createBottomTabNavigator<InsideTabParamsList>()

const BackgroundImage = styled(LinearGradient, {
  w: '100%',
  h: '100%',
  o: 0.2,
  colors: ['rgba(252, 205, 108, 0)', '#FCCD6C'],
})

export default function InsideScreen(): JSX.Element {
  return (
    <>
      <Stack
        bg="$black"
        pos="absolute"
        top={0}
        left={0}
        right={0}
        h={CHART_HEIGHT_PX + CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING}
      >
        <BackgroundImage colors={['rgba(252, 205, 108, 0)', '#FCCD6C']} />
      </Stack>
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

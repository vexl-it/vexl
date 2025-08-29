import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs'
import React from 'react'
import {type EventsAndClubsParamsList} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import ClubsScreen from './components/ClubsScreen'
import EventsScreen from './components/EventsScreen'
import TabBar from './components/TabBar'

const Tab = createMaterialTopTabNavigator<EventsAndClubsParamsList>()

export default function EventsAndClubsScreen(): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()

  return (
    <Screen>
      <ScreenTitle
        allowMultipleLines
        mb="$5"
        text={t('eventsAndClubs.title')}
        mx="$4"
      >
        <IconButton
          iconStroke="white"
          variant="dark"
          icon={closeSvg}
          onPress={safeGoBack}
        />
      </ScreenTitle>
      <Tab.Navigator
        tabBar={TabBar}
        screenOptions={{
          animationEnabled: true,
        }}
      >
        <Tab.Screen
          options={{tabBarLabel: 'events'}}
          name="Events"
          component={EventsScreen}
        />
        <Tab.Screen
          options={{tabBarLabel: 'clubs'}}
          name="Clubs"
          component={ClubsScreen}
        />
      </Tab.Navigator>
    </Screen>
  )
}

import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React from 'react'
import {type AppSettingsStackParamsList} from '../../navigationTypes'
import AppSettingsAppearanceScreen from './components/AppSettingsAppearanceScreen'
import AppSettingsCurrencyScreen from './components/AppSettingsCurrencyScreen'
import AppSettingsDefaultScreen from './components/AppSettingsDefaultScreen'
import AppSettingsLanguageScreen from './components/AppSettingsLanguageScreen'

const Stack = createNativeStackNavigator<AppSettingsStackParamsList>()

function AppSettingsScreen(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="AppSettingsDefault"
      screenOptions={{
        headerShown: false,
        presentation: 'card',
      }}
    >
      <Stack.Screen
        name="AppSettingsDefault"
        component={AppSettingsDefaultScreen}
      />
      <Stack.Screen
        name="AppSettingsLanguage"
        component={AppSettingsLanguageScreen}
      />
      <Stack.Screen
        name="AppSettingsCurrency"
        component={AppSettingsCurrencyScreen}
      />
      <Stack.Screen
        name="AppSettingsAppearance"
        component={AppSettingsAppearanceScreen}
      />
    </Stack.Navigator>
  )
}

export default AppSettingsScreen

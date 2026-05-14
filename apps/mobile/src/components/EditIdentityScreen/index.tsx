import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React from 'react'
import {type EditIdentityStackParamsList} from '../../navigationTypes'
import EditIdentityNicknameScreen from './components/EditIdentityNicknameScreen'
import EditIdentityPhotoScreen from './components/EditIdentityPhotoScreen'
import EditIdentitySummaryScreen from './components/EditIdentitySummaryScreen'

const Stack = createNativeStackNavigator<EditIdentityStackParamsList>()

function EditIdentityScreen(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="EditIdentityPhoto"
      screenOptions={{
        headerShown: false,
        presentation: 'card',
      }}
    >
      <Stack.Screen
        name="EditIdentityPhoto"
        component={EditIdentityPhotoScreen}
      />
      <Stack.Screen
        name="EditIdentityNickname"
        component={EditIdentityNicknameScreen}
      />
      <Stack.Screen
        name="EditIdentitySummary"
        component={EditIdentitySummaryScreen}
      />
    </Stack.Navigator>
  )
}

export default EditIdentityScreen

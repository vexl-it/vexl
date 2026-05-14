import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React from 'react'
import {type EditProfileStackParamsList} from '../../navigationTypes'
import EditProfileDefaultScreen from './components/EditProfileDefaultScreen'
import EditProfileSpokenLanguagesScreen from './components/EditProfileSpokenLanguagesScreen'

const Stack = createNativeStackNavigator<EditProfileStackParamsList>()

function EditProfileScreen(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="EditProfileDefault"
      screenOptions={{
        headerShown: false,
        presentation: 'card',
      }}
    >
      <Stack.Screen
        name="EditProfileDefault"
        component={EditProfileDefaultScreen}
      />
      <Stack.Screen
        name="EditProfileSpokenLanguages"
        component={EditProfileSpokenLanguagesScreen}
      />
    </Stack.Navigator>
  )
}

export default EditProfileScreen

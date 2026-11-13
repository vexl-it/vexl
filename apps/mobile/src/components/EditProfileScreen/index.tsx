import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React from 'react'
import {type EditProfileStackParamsList} from '../../navigationTypes'
import CountryPickerScreen from '../PhoneVerification/CountryPickerScreen'
import AddPhoneNumberScreen from './components/AddPhoneNumberScreen'
import AddPhoneNumberVerificationCodeScreen from './components/AddPhoneNumberVerificationCodeScreen'
import EditProfileDefaultScreen from './components/EditProfileDefaultScreen'
import EditProfilePhoneNumbersScreen from './components/EditProfilePhoneNumbersScreen'
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
      <Stack.Screen
        name="EditProfilePhoneNumbers"
        component={EditProfilePhoneNumbersScreen}
      />
      <Stack.Screen name="AddPhoneNumber" component={AddPhoneNumberScreen} />
      <Stack.Screen
        name="AddPhoneNumberCountryPicker"
        component={CountryPickerScreen}
      />
      <Stack.Screen
        name="AddPhoneNumberVerificationCode"
        component={AddPhoneNumberVerificationCodeScreen}
      />
    </Stack.Navigator>
  )
}

export default EditProfileScreen

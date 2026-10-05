import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {type LoginFlowStackParamsList} from '../../navigationTypes'
import {reportAppOpenedWhileLoggedOutActionAtom} from '../../utils/analytics'
import CountryPickerScreen from './components/CountryPickerScreen'
import Intro1Screen from './components/Intro1Screen'
import Intro2Screen from './components/Intro2Screen'
import PhoneNumberScreen from './components/PhoneNumberScreen'
import VerificationCodeScreen from './components/VerificationCodeScreen'

const LoginStack = createNativeStackNavigator<LoginFlowStackParamsList>()

export default function LoginFlow(): React.ReactElement {
  const reportAppOpened = useSetAtom(reportAppOpenedWhileLoggedOutActionAtom)

  useEffect(() => {
    reportAppOpened()
  }, [reportAppOpened])

  return (
    <LoginStack.Navigator
      initialRouteName="Intro1"
      screenOptions={{
        headerShown: false,
        presentation: 'card',
      }}
    >
      <LoginStack.Screen name="Intro1" component={Intro1Screen} />
      <LoginStack.Screen name="Intro2" component={Intro2Screen} />
      <LoginStack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
      <LoginStack.Screen name="CountryPicker" component={CountryPickerScreen} />
      <LoginStack.Screen
        name="VerificationCode"
        component={VerificationCodeScreen}
      />
    </LoginStack.Navigator>
  )
}

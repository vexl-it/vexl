import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React from 'react'
import {type LoginStackParamsList} from '../../navigationTypes'
import PageWithButtonAndProgressHeader from '../PageWithButtonAndProgressHeader'
import AnonymizationAnimationScreen from './components/AnonymizationAnimationScreen'
import AnonymizationNoticeScreen from './components/AnonymizationNoticeScreen'
import IntroScreen from './components/IntroScreen'
import NameScreen from './components/NameScreen'
import PhoneNumberScreen from './components/PhoneNumberScreen'
import PhotoScreen from './components/PhotoScreen'
import StartScreen from './components/StartScreen'
import SuccessLoginScreen from './components/SuccessLoginScreen'
import VerificationCodeScreen from './components/VerificationCodeScreen'

const LoginStack = createNativeStackNavigator<LoginStackParamsList>()

function LoginFlow(): React.ReactElement {
  return (
    <PageWithButtonAndProgressHeader>
      <LoginStack.Navigator
        screenOptions={{
          headerShown: false,
          presentation: 'card',
        }}
        initialRouteName="Intro"
      >
        <LoginStack.Screen
          name="AnonymizationAnimation"
          component={AnonymizationAnimationScreen}
        />
        <LoginStack.Screen
          name="AnonymizationNotice"
          component={AnonymizationNoticeScreen}
        />
        <LoginStack.Screen name="Intro" component={IntroScreen} />
        <LoginStack.Screen name="Name" component={NameScreen} />
        <LoginStack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
        <LoginStack.Screen name="Photo" component={PhotoScreen} />
        <LoginStack.Screen name="Start" component={StartScreen} />
        <LoginStack.Screen
          name="VerificationCode"
          component={VerificationCodeScreen}
        />
        <LoginStack.Screen name="SuccessLogin" component={SuccessLoginScreen} />
      </LoginStack.Navigator>
    </PageWithButtonAndProgressHeader>
  )
}

export default LoginFlow

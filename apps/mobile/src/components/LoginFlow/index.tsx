import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {type LoginFlowStackParamsList} from '../../navigationTypes'
import {showAccountMovedNoticeIfPendingActionAtom} from '../../state/accountMovedNotice'
import {useAppState} from '../../utils/useAppState'
import CountryPickerScreen from './components/CountryPickerScreen'
import Intro1Screen from './components/Intro1Screen'
import Intro2Screen from './components/Intro2Screen'
import PhoneNumberScreen from './components/PhoneNumberScreen'
import RestoreFromBackupScreen from './components/RestoreFromBackupScreen'
import RestoreIntroScreen from './components/RestoreIntroScreen'
import RestorePinScreen from './components/RestorePinScreen'
import RestoreWrongPhoneNumberScreen from './components/RestoreWrongPhoneNumberScreen'
import VerificationCodeScreen from './components/VerificationCodeScreen'

const LoginStack = createNativeStackNavigator<LoginFlowStackParamsList>()

export default function LoginFlow(): React.ReactElement {
  const showAccountMovedNoticeIfPending = useSetAtom(
    showAccountMovedNoticeIfPendingActionAtom
  )
  useAppState(
    useCallback(
      (state) => {
        if (state === 'active')
          Effect.runFork(showAccountMovedNoticeIfPending())
      },
      [showAccountMovedNoticeIfPending]
    )
  )

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
      <LoginStack.Screen name="RestoreIntro" component={RestoreIntroScreen} />
      <LoginStack.Screen
        name="RestoreWrongPhoneNumber"
        component={RestoreWrongPhoneNumberScreen}
      />
      <LoginStack.Screen name="RestorePin" component={RestorePinScreen} />
      <LoginStack.Screen
        name="RestoreFromBackup"
        component={RestoreFromBackupScreen}
        options={{gestureEnabled: false}}
      />
    </LoginStack.Navigator>
  )
}

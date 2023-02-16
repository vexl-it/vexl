import {createNativeStackNavigator} from '@react-navigation/native-stack'
import IntroScreen from './components/IntroScreen'
import StartScreen from './components/StartScreen'
import PhoneNumberScreen from './components/PhoneNumberScreen'
import styled from '@emotion/native'
import NameScreen from './components/NameScreen'
import AnonymizationNoticeScreen from './components/AnonymizationNoticeScreen'
import AnonymizationAnimationScreen from './components/AnonymizationAnimationScreen'
import PhotoScreen from './components/PhotoScreen'
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar as RNStatusBar,
  View,
} from 'react-native'
import {type InitPhoneNumberVerificationResponse} from '@vexl-next/rest-api/dist/services/user/contracts'
import {type E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import VerificationCodeScreen from './components/VerificationCodeScreen'
import SuccessLoginScreen from './components/SuccessLoginScreen'
import {type UserName} from '@vexl-next/domain/dist/general/UserName.brand'
import {type UserNameAndAvatar} from '@vexl-next/domain/dist/general/UserNameAndAvatar.brand'
import {type SerializedPrivateKey} from './utils'
import Button from '../Button'
import {useAtom} from 'jotai'
import nextButtonAtom from './state/nextButtonAtom'
import Header from './components/Header/Header'

const RootContainer = styled.SafeAreaView`
  background-color: ${(p) => p.theme.colors.backgroundBlack};
  flex: 1;
`

const InnerContainer = styled.View`
  flex: 1;
  padding: 0 8px 8px;
`

const NextButton = styled(Button)`
  margin-top: 16px;
`

// This have to be 'type' instead of interface. According to official docs
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type LoginStackParamsList = {
  AnonymizationAnimation: {
    readonly realUserData: UserNameAndAvatar
  }
  AnonymizationNotice: undefined
  Intro: undefined
  Name: undefined
  PhoneNumber: {
    readonly realUserData: UserNameAndAvatar
    readonly anonymizedUserData: UserNameAndAvatar
  }
  Photo: {userName: UserName}
  Start: undefined
  SuccessLogin: {
    readonly sessionCredentials: {
      hash: string
      signature: string
      privateKey: SerializedPrivateKey
    }
    readonly realUserData: UserNameAndAvatar
    readonly anonymizedUserData: UserNameAndAvatar
    readonly phoneNumber: E164PhoneNumber
  }
  VerificationCode: {
    readonly realUserData: UserNameAndAvatar
    readonly anonymizedUserData: UserNameAndAvatar
    readonly phoneNumber: E164PhoneNumber
    readonly initPhoneVerificationResponse: InitPhoneNumberVerificationResponse
  }
}

const LoginStack = createNativeStackNavigator<LoginStackParamsList>()

function LoginFlow(): JSX.Element {
  const [nextButtonState] = useAtom(nextButtonAtom)

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{flex: 1}}
    >
      <RootContainer>
        <View style={{height: RNStatusBar.currentHeight ?? 0}} />
        <InnerContainer>
          <Header />
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
            <LoginStack.Screen
              name="PhoneNumber"
              component={PhoneNumberScreen}
            />
            <LoginStack.Screen name="Photo" component={PhotoScreen} />
            <LoginStack.Screen name="Start" component={StartScreen} />
            <LoginStack.Screen
              name="VerificationCode"
              component={VerificationCodeScreen}
            />
            <LoginStack.Screen
              name="SuccessLogin"
              component={SuccessLoginScreen}
            />
          </LoginStack.Navigator>
          {nextButtonState.text && (
            <NextButton
              variant="secondary"
              text={nextButtonState.text}
              disabled={!nextButtonState.onPress}
              onPress={() => {
                if (!nextButtonState.onPress) {
                  return
                }
                nextButtonState.onPress()
              }}
            />
          )}
        </InnerContainer>
      </RootContainer>
    </KeyboardAvoidingView>
  )
}

export default LoginFlow

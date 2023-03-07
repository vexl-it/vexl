import {createNativeStackNavigator} from '@react-navigation/native-stack'
import IntroScreen from './components/IntroScreen'
import StartScreen from './components/StartScreen'
import PhoneNumberScreen from './components/PhoneNumberScreen'
import NameScreen from './components/NameScreen'
import AnonymizationNoticeScreen from './components/AnonymizationNoticeScreen'
import AnonymizationAnimationScreen from './components/AnonymizationAnimationScreen'
import PhotoScreen from './components/PhotoScreen'
import VerificationCodeScreen from './components/VerificationCodeScreen'
import SuccessLoginScreen from './components/SuccessLoginScreen'
import {type LoginStackParamsList} from '../../navigationTypes'
import PageWithButtonAndProgressHeader from '../PageWithButtonAndProgressHeader'

const LoginStack = createNativeStackNavigator<LoginStackParamsList>()

function LoginFlow(): JSX.Element {
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

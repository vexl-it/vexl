import {StatusBar} from 'expo-status-bar'
import {DefaultTheme, NavigationContainer} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import * as SplashScreen from 'expo-splash-screen'
import {useEffect} from 'react'
import useLoadFonts from './utils/useLoadFonts'
import IntroScreen from './components/IntroScreen'
import StartScreen from './components/StartScreen'
import I18nProvider from './utils/localization/I18nProvider'
import ThemeProvider from './utils/ThemeProvider'
import {useTheme} from '@emotion/react'
import crypto from 'react-native-quick-crypto'

void SplashScreen.preventAutoHideAsync()

const Stack = createNativeStackNavigator()

function App(): JSX.Element {
  const [fontsLoaded] = useLoadFonts()
  const theme = useTheme()

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  // Handled by splashscreen
  if (!fontsLoaded) return <></>

  return (
    <>
      <I18nProvider>
        <StatusBar style="light" />
        <NavigationContainer
          theme={{
            ...DefaultTheme,
            dark: true,
            colors: {
              ...DefaultTheme.colors,
              background: theme.colors.backgroundBlack,
              text: theme.text.lightColorText,
            },
          }}
        >
          <Stack.Navigator
            screenOptions={{headerShown: false}}
            initialRouteName="Start"
          >
            <Stack.Screen name="Intro" component={IntroScreen} />
            <Stack.Screen name="Start" component={StartScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </I18nProvider>
    </>
  )
}

export default function _(): JSX.Element {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  )
}

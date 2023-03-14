import {StatusBar} from 'expo-status-bar'
import {DefaultTheme, NavigationContainer} from '@react-navigation/native'
import * as SplashScreen from 'expo-splash-screen'
import {useEffect} from 'react'
import useLoadFonts from './utils/useLoadFonts'
import I18nProvider from './utils/localization/I18nProvider'
import ThemeProvider from './utils/ThemeProvider'
import {useTheme} from '@emotion/react'
import RootNavigation from './components/RootNavigation'
import LoadingOverlayProvider from './components/LoadingOverlayProvider'
import {useIsSessionLoaded} from './state/session'
import {SafeAreaProvider} from 'react-native-safe-area-context'

void SplashScreen.preventAutoHideAsync()

function App(): JSX.Element {
  const [fontsLoaded] = useLoadFonts()
  const theme = useTheme()
  const sessionLoaded = useIsSessionLoaded()

  useEffect(() => {
    if (fontsLoaded && sessionLoaded) {
      void SplashScreen.hideAsync()
    }
  }, [fontsLoaded, sessionLoaded])

  // Handled by splashscreen
  if (!fontsLoaded) return <></>

  return (
    <I18nProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer
          theme={{
            ...DefaultTheme,
            dark: true,
            colors: {
              ...DefaultTheme.colors,
              primary: theme.colors.main,
              background: 'transparent',
              text: theme.colors.lightColorText,
            },
          }}
        >
          <LoadingOverlayProvider>
            <RootNavigation />
          </LoadingOverlayProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </I18nProvider>
  )
}

export default function _(): JSX.Element {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  )
}

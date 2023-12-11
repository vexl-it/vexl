import {StatusBar} from 'expo-status-bar'
import {DefaultTheme, NavigationContainer} from '@react-navigation/native'
import * as SplashScreen from 'expo-splash-screen'
import {useEffect} from 'react'
import useLoadFonts from './utils/useLoadFonts'
import ThemeProvider from './utils/ThemeProvider'
import RootNavigation from './components/RootNavigation'
import LoadingOverlayProvider from './components/LoadingOverlayProvider'
import {useIsSessionLoaded} from './state/session'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {useTheme} from 'tamagui'
import AreYouSureDialog from './components/AreYouSureDialog'
import MaintenanceAndForceUpdateCheck from './components/MaintenanceAndForceUpdateCheck'
import useSetupRemoteConfig from './utils/remoteConfig/useSetupRemoteConfig'
import 'react-native-gesture-handler'
import {navigationRef} from './utils/navigation'
import BadgeCountManager from './components/BadgeCountManager'
import {useAppState} from './utils/useAppState'
import {setLastTimeAppWasRunningToNow} from './utils/lastTimeAppWasRunning'
import UploadingOfferProgressModal from './components/UploadingOfferProgressModal'
import {subscribeToGeneralTopic} from './utils/notifications'
import PreventScreenshots from './components/PreventScreenshots'

void SplashScreen.preventAutoHideAsync()

function App(): JSX.Element {
  const [fontsLoaded] = useLoadFonts()
  const theme = useTheme()
  const sessionLoaded = useIsSessionLoaded()
  const remoteConfigSetup = useSetupRemoteConfig()

  useEffect(() => {
    if (fontsLoaded && sessionLoaded && remoteConfigSetup) {
      void SplashScreen.hideAsync()
    }
  }, [fontsLoaded, sessionLoaded, remoteConfigSetup])

  useAppState(setLastTimeAppWasRunningToNow, true)

  useEffect(() => {
    void subscribeToGeneralTopic()
  })

  // Handled by splashscreen
  if (!fontsLoaded) return <></>

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <BadgeCountManager />
      <PreventScreenshots />
      <NavigationContainer
        ref={navigationRef}
        theme={{
          dark: true,
          colors: {
            ...DefaultTheme.colors,
            primary: theme.background?.val,
            background: 'transparent',
            text: theme.color?.val,
          },
        }}
      >
        <LoadingOverlayProvider>
          <MaintenanceAndForceUpdateCheck>
            <RootNavigation />
            <UploadingOfferProgressModal />
          </MaintenanceAndForceUpdateCheck>
        </LoadingOverlayProvider>
        <AreYouSureDialog />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

export default function _(): JSX.Element {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  )
}

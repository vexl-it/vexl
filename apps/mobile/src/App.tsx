import {DefaultTheme, NavigationContainer} from '@react-navigation/native'
import * as SplashScreen from 'expo-splash-screen'
import {StatusBar} from 'expo-status-bar'
import {useEffect} from 'react'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {useTheme} from 'tamagui'
import AreYouSureDialog from './components/AreYouSureDialog'
import BadgeCountManager from './components/BadgeCountManager'
import ContactsHashingProgressModal from './components/ContactsHashingProgressModal'
import LoadingOverlayProvider from './components/LoadingOverlayProvider'
import MaintenanceAndForceUpdateCheck from './components/MaintenanceAndForceUpdateCheck'
import PreventScreenshots from './components/PreventScreenshots'
import RootNavigation from './components/RootNavigation'
import UploadingOfferProgressModal from './components/UploadingOfferProgressModal'
import {useIsSessionLoaded} from './state/session'
import {loadSession} from './state/session/loadSession'
import ThemeProvider from './utils/ThemeProvider'
import {setLastTimeAppWasRunningToNow} from './utils/lastTimeAppWasRunning'
import {navigationRef} from './utils/navigation'
import {subscribeToGeneralTopic} from './utils/notifications'
import useSetupRemoteConfig from './utils/remoteConfig/useSetupRemoteConfig'
import {useAppState} from './utils/useAppState'
import useLoadFonts from './utils/useLoadFonts'

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
    void loadSession({forceReload: true, showErrorAlert: true})
    void subscribeToGeneralTopic()
  }, [])

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
            <GestureHandlerRootView style={{flex: 1}}>
              <RootNavigation />
            </GestureHandlerRootView>
            <UploadingOfferProgressModal />
            <ContactsHashingProgressModal />
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

import {DefaultTheme, NavigationContainer} from '@react-navigation/native'
import * as SplashScreen from 'expo-splash-screen'
import {StatusBar} from 'expo-status-bar'
import {getDefaultStore, useStore} from 'jotai'
import {useEffect} from 'react'
import 'react-native-gesture-handler'
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
import {loadSession, useIsSessionLoaded} from './state/session'
import ThemeProvider from './utils/ThemeProvider'
import {setLastTimeAppWasRunningToNow} from './utils/lastTimeAppWasRunning'
import {navigationRef} from './utils/navigation'
import {
  showDebugNotificationIfEnabled,
  subscribeToGeneralTopic,
} from './utils/notifications'
import useSetupRemoteConfig from './utils/remoteConfig/useSetupRemoteConfig'
import {useAppState} from './utils/useAppState'
import useLoadFonts from './utils/useLoadFonts'

void SplashScreen.preventAutoHideAsync()

function App(): JSX.Element {
  const [fontsLoaded] = useLoadFonts()
  const theme = useTheme()
  const sessionLoaded = useIsSessionLoaded()
  const remoteConfigSetup = useSetupRemoteConfig()
  const store = useStore()

  useEffect(() => {
    void showDebugNotificationIfEnabled({
      title: 'Checking session loaded',
      body: `sessionLoaded: ${sessionLoaded}`,
    })

    if (fontsLoaded && sessionLoaded && remoteConfigSetup) {
      void SplashScreen.hideAsync()
    }
  }, [fontsLoaded, sessionLoaded, remoteConfigSetup])

  useAppState(setLastTimeAppWasRunningToNow, true)

  useEffect(() => {
    void subscribeToGeneralTopic()
  })

  useEffect(() => {
    void showDebugNotificationIfEnabled({
      title: 'Checking store',
      body: `store === defaultStore ${getDefaultStore() === store}`,
    })

    void loadSession(store, true, true)
  }, [store])

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

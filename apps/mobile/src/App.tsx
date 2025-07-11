import {DefaultTheme, NavigationContainer} from '@react-navigation/native'
import {StatusBar} from 'expo-status-bar'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {useTheme} from 'tamagui'
import AnimatedSplashScreen from './AnimatedSplashScreen'
import AreYouSureDialog from './components/AreYouSureDialog'
import BadgeCountManager from './components/BadgeCountManager'
import DisableLogBoxForTests from './components/DisableLogBoxForTests'
import {
  OverlayInfoScreen,
  useLoadNewsAndAnnouncements,
} from './components/FullscreenWarningScreen'
import LoadingOverlayProvider from './components/LoadingOverlayProvider'
import PhoneNumberHashBugMigration from './components/PhoneNumberHashBugMigration'
import PreventScreenshots from './components/PreventScreenshots'
import RootNavigation from './components/RootNavigation'
import ToastNotification from './components/ToastNotification'
import UploadingOfferProgressModal from './components/UploadingOfferProgressModal'
import VersionMigrations from './components/VersionMigrations'
import ThemeProvider from './utils/ThemeProvider'
import {setLastTimeAppWasRunningToNow} from './utils/lastTimeAppWasRunning'
import {navigationRef} from './utils/navigation'
import {useAppState} from './utils/useAppState'

function App(): JSX.Element {
  const theme = useTheme()

  useAppState(setLastTimeAppWasRunningToNow, true)
  useLoadNewsAndAnnouncements()

  return (
    <SafeAreaProvider>
      <BadgeCountManager />
      <PreventScreenshots />
      <DisableLogBoxForTests />
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
          <VersionMigrations>
            <PhoneNumberHashBugMigration>
              <OverlayInfoScreen>
                <GestureHandlerRootView style={{flex: 1}}>
                  <RootNavigation />
                </GestureHandlerRootView>
              </OverlayInfoScreen>
            </PhoneNumberHashBugMigration>
          </VersionMigrations>
          <UploadingOfferProgressModal />
        </LoadingOverlayProvider>
        <AreYouSureDialog />
        <ToastNotification />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

export default function _(): JSX.Element {
  return (
    <ThemeProvider>
      <StatusBar style="light" />
      <AnimatedSplashScreen>
        <App />
      </AnimatedSplashScreen>
    </ThemeProvider>
  )
}

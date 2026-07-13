import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native'
import {useVexlTheme} from '@vexl-next/ui'
import {addEventListener} from 'expo-linking'
import {NavigationBar} from 'expo-navigation-bar'
import {StatusBar} from 'expo-status-bar'
import React, {useSyncExternalStore} from 'react'
import {Platform} from 'react-native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {KeyboardProvider} from 'react-native-keyboard-controller'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {useTheme} from 'tamagui'
import AnimatedSplashScreen from './AnimatedSplashScreen'
import BadgeCountManager from './components/BadgeCountManager'
import DeviceMigrationRoot from './components/DeviceMigrationRoot'
import {
  getMigrationUiState,
  subscribeToMigrationUiState,
} from './components/DeviceMigrationRoot/coordinator'
import DisableLogBoxForTests from './components/DisableLogBoxForTests'
import ErrorAlert from './components/ErrorAlert'
import {OverlayInfoScreen} from './components/FullscreenWarningScreen'
import {GlobalDialog} from './components/GlobalDialog'
import LoadingOverlayProvider from './components/LoadingOverlayProvider'
import PreventScreenshots from './components/PreventScreenshots'
import RootNavigation from './components/RootNavigation'
import ToastNotification from './components/ToastNotification'
import UploadingOfferProgressModal from './components/UploadingOfferProgressModal'
import {UserFeedbackDialog} from './components/UserFeedback/UserFeedbackDialog'
import VersionMigrations from './components/VersionMigrations'
import {useSetAppLanguageFromStore} from './state/useSetAppLanguageFromStore'
import {useSetRelativeDateFormatting} from './state/useSetRelativeDateFormatting'
import ThemeProvider from './utils/ThemeProvider'
import {useMigrationControlRecord} from './utils/deviceMigration/controlStore/useMigrationControlRecord'
import {useInAppLoadingTasks} from './utils/inAppLoadingTasks/useInAppLoadingTasks'
import {setLastTimeAppWasRunningToNow} from './utils/lastTimeAppWasRunning'
import {navigationRef} from './utils/navigation'
import {useAppState} from './utils/useAppState'

function App(): React.ReactElement {
  const theme = useTheme()
  const {resolvedTheme} = useVexlTheme()
  const isDarkTheme = resolvedTheme === 'dark'
  const navigationTheme = isDarkTheme ? DarkTheme : DefaultTheme

  useAppState(setLastTimeAppWasRunningToNow)

  useSetAppLanguageFromStore()
  useSetRelativeDateFormatting()
  useInAppLoadingTasks()

  React.useEffect(() => {
    if (!__DEV__) return

    const subscription = addEventListener('url', ({url}) => {
      if (!navigationRef.isReady()) return
      if (url === 'app.vexl.it://emulator-test/debug') {
        navigationRef.navigate('DebugScreen')
      } else if (url === 'app.vexl.it://emulator-test/account') {
        navigationRef.navigate('Account')
      } else if (url === 'app.vexl.it://emulator-test/home') {
        navigationRef.navigate('InsideTabs', {screen: 'Marketplace'})
      }
    })
    return () => {
      subscription.remove()
    }
  }, [])

  return (
    <SafeAreaProvider>
      <KeyboardProvider
        navigationBarTranslucent={Platform.OS === 'android'}
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <BadgeCountManager />
        <PreventScreenshots />
        <DisableLogBoxForTests />
        <AppStatusBar />
        <NavigationContainer
          ref={navigationRef}
          theme={{
            ...navigationTheme,
            dark: isDarkTheme,
            colors: {
              ...navigationTheme.colors,
              primary: theme.background?.get(),
              background: theme.backgroundPrimary.get(),
              text: theme.color?.get(),
            },
            fonts: {
              regular: {
                fontFamily: 'TTSatoshi400',
                fontWeight: '400',
              },
              medium: {
                fontFamily: 'TTSatoshi500',
                fontWeight: '500',
              },
              bold: {
                fontFamily: 'TTSatoshi600',
                fontWeight: '600',
              },
              heavy: {
                fontFamily: 'TTSatoshi700',
                fontWeight: '700',
              },
            },
          }}
        >
          <LoadingOverlayProvider>
            <VersionMigrations>
              <OverlayInfoScreen>
                <GestureHandlerRootView
                  style={{
                    flex: 1,
                    backgroundColor: theme.backgroundPrimary.get(),
                  }}
                >
                  <RootNavigation />
                  {/* <InAppLoadingTasksIndicator /> */}
                </GestureHandlerRootView>
              </OverlayInfoScreen>
            </VersionMigrations>
            <UploadingOfferProgressModal />
          </LoadingOverlayProvider>
          <GlobalDialog />
          <UserFeedbackDialog />
          <ErrorAlert />
          <ToastNotification />
        </NavigationContainer>
      </KeyboardProvider>
    </SafeAreaProvider>
  )
}

const AppStatusBar = (): React.ReactElement => {
  const {resolvedTheme} = useVexlTheme()
  const isDarkTheme = resolvedTheme === 'dark'
  const navigationBarStyle = isDarkTheme ? 'dark' : 'light'

  React.useEffect(() => {
    if (Platform.OS !== 'android') return

    NavigationBar.setStyle(navigationBarStyle)
  }, [navigationBarStyle])

  return <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
}

export default function Root(): React.ReactElement {
  // Boot gate (spec section "Application execution modes"): the durable
  // migration control record is read synchronously BEFORE the normal
  // splash/session loader mounts. In any migration mode the migration-only
  // root replaces the entire normal tree, keeping out loadSession, loading
  // tasks, version migrations, notification handling and every other
  // account-state writer. The record is subscribed, so a safe cancellation
  // back to 'normal' swaps the normal root back in without an app restart.
  const migrationControlRecord = useMigrationControlRecord()
  const migrationUiState = useSyncExternalStore(
    subscribeToMigrationUiState,
    getMigrationUiState
  )
  const migrationUiActive = migrationUiState.phase !== 'idle'

  return (
    <ThemeProvider>
      {migrationControlRecord.mode === 'normal' && !migrationUiActive ? (
        <AnimatedSplashScreen>
          <App />
        </AnimatedSplashScreen>
      ) : (
        <DeviceMigrationRoot controlRecord={migrationControlRecord} />
      )}
    </ThemeProvider>
  )
}

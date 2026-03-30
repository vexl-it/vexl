import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native'
import {useVexlTheme} from '@vexl-next/ui'
import * as NavigationBar from 'expo-navigation-bar'
import {StatusBar} from 'expo-status-bar'
import {useAtomValue} from 'jotai'
import React from 'react'
import {Platform, View} from 'react-native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {KeyboardProvider} from 'react-native-keyboard-controller'
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import {useTheme} from 'tamagui'
import AnimatedSplashScreen from './AnimatedSplashScreen'
import AreYouSureDialog from './components/AreYouSureDialog'
import BadgeCountManager from './components/BadgeCountManager'
import DisableLogBoxForTests from './components/DisableLogBoxForTests'
import ErrorAlert from './components/ErrorAlert'
import {OverlayInfoScreen} from './components/FullscreenWarningScreen'
import {GlobalDialog} from './components/GlobalDialog'
import InAppLoadingTasksIndicator from './components/InAppLoadingTasksIndicator'
import LoadingOverlayProvider from './components/LoadingOverlayProvider'
import PreventScreenshots from './components/PreventScreenshots'
import RootNavigation from './components/RootNavigation'
import ToastNotification from './components/ToastNotification'
import UploadingOfferProgressModal from './components/UploadingOfferProgressModal'
import VersionMigrations from './components/VersionMigrations'
import {StatusBarStyleAtom} from './state/statusBarStyleAtom'
import {useSetAppLanguageFromStore} from './state/useSetAppLanguageFromStore'
import {useSetRelativeDateFormatting} from './state/useSetRelativeDateFormatting'
import ThemeProvider from './utils/ThemeProvider'
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

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
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
              primary: theme.background?.val,
              background: theme.backgroundPrimary.val,
              text: theme.color?.val,
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
                    backgroundColor: theme.backgroundPrimary.val,
                  }}
                >
                  <RootNavigation />
                  <InAppLoadingTasksIndicator />
                </GestureHandlerRootView>
              </OverlayInfoScreen>
            </VersionMigrations>
            <UploadingOfferProgressModal />
          </LoadingOverlayProvider>
          <AreYouSureDialog />
          <GlobalDialog />
          <ErrorAlert />
          <ToastNotification />
        </NavigationContainer>
      </KeyboardProvider>
    </SafeAreaProvider>
  )
}

const AppStatusBar = (): React.ReactElement => {
  const {resolvedTheme} = useVexlTheme()
  const statusBarStyle = useAtomValue(StatusBarStyleAtom)
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const isDarkTheme = resolvedTheme === 'dark'
  const backgroundColor =
    statusBarStyle === 'secondary'
      ? theme.backgroundSecondary.val
      : theme.backgroundPrimary.val
  const navigationBarStyle = isDarkTheme ? 'dark' : 'light'

  React.useEffect(() => {
    if (Platform.OS !== 'android') return

    NavigationBar.setStyle(navigationBarStyle)
  }, [navigationBarStyle])

  return (
    <>
      <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor,
          zIndex: 1,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: insets.bottom,
          backgroundColor,
          zIndex: 1,
        }}
      />
    </>
  )
}

export default function _(): React.ReactElement {
  return (
    <ThemeProvider>
      <AnimatedSplashScreen>
        <App />
      </AnimatedSplashScreen>
    </ThemeProvider>
  )
}

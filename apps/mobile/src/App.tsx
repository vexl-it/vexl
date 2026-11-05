import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native'
import {bodyFont, useTheme, useVexlTheme} from '@vexl-next/ui'
import {NavigationBar} from 'expo-navigation-bar'
import {StatusBar} from 'expo-status-bar'
import React from 'react'
import {Platform} from 'react-native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {KeyboardProvider} from 'react-native-keyboard-controller'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import AnimatedSplashScreen from './AnimatedSplashScreen'
import BadgeCountManager from './components/BadgeCountManager'
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
import {useSyncNseBridge} from './state/notifications/nseBridge/useSyncNseBridge'
import {useSetRelativeDateFormatting} from './state/useSetRelativeDateFormatting'
import ThemeProvider from './utils/ThemeProvider'
import {useInAppLoadingTasks} from './utils/inAppLoadingTasks/useInAppLoadingTasks'
import {setLastTimeAppWasRunningToNow} from './utils/lastTimeAppWasRunning'
import {navigationRef} from './utils/navigation'
import {useRegisterNseChatPreviewCategory} from './utils/notifications/nseEnrichedNotifications'
import {useAppState} from './utils/useAppState'

function App(): React.ReactElement {
  const theme = useTheme()
  const {resolvedTheme} = useVexlTheme()
  const isDarkTheme = resolvedTheme === 'dark'
  const navigationTheme = isDarkTheme ? DarkTheme : DefaultTheme

  useAppState(setLastTimeAppWasRunningToNow)

  useSetRelativeDateFormatting()
  useInAppLoadingTasks()
  useSyncNseBridge()
  useRegisterNseChatPreviewCategory()

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
              primary: theme.accentYellowPrimary.get(),
              background: theme.backgroundPrimary.get(),
              text: theme.foregroundPrimary.get(),
            },
            fonts: {
              regular: {
                fontFamily: bodyFont.face[400].normal,
                fontWeight: '400',
              },
              medium: {
                fontFamily: bodyFont.face[500].normal,
                fontWeight: '500',
              },
              bold: {
                fontFamily: bodyFont.face[600].normal,
                fontWeight: '600',
              },
              heavy: {
                fontFamily: bodyFont.face[700].normal,
                fontWeight: '700',
              },
            },
          }}
        >
          <LoadingOverlayProvider>
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

export default function _(): React.ReactElement {
  return (
    <ThemeProvider>
      <AnimatedSplashScreen>
        <App />
      </AnimatedSplashScreen>
    </ThemeProvider>
  )
}

import {DefaultTheme, NavigationContainer} from '@react-navigation/native'
import {StatusBar} from 'expo-status-bar'
import React from 'react'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {KeyboardProvider} from 'react-native-keyboard-controller'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {useTheme} from 'tamagui'
import AnimatedSplashScreen from './AnimatedSplashScreen'
import AreYouSureDialog from './components/AreYouSureDialog'
import BadgeCountManager from './components/BadgeCountManager'
import DisableLogBoxForTests from './components/DisableLogBoxForTests'
import ErrorAlert from './components/ErrorAlert'
import {OverlayInfoScreen} from './components/FullscreenWarningScreen'
import InAppLoadingTasksIndicator from './components/InAppLoadingTasksIndicator'
import LoadingOverlayProvider from './components/LoadingOverlayProvider'
import PhoneNumberHashBugMigration from './components/PhoneNumberHashBugMigration'
import PreventScreenshots from './components/PreventScreenshots'
import RootNavigation from './components/RootNavigation'
import ToastNotification from './components/ToastNotification'
import UploadingOfferProgressModal from './components/UploadingOfferProgressModal'
import VersionMigrations from './components/VersionMigrations'
import {useSetAppLanguageFromStore} from './state/useSetAppLanguageFromStore'
import {useSetRelativeDateFormatting} from './state/useSetRelativeDateFormatting'
import ThemeProvider from './utils/ThemeProvider'
import appConfig from './utils/ThemeProvider/tamagui.config'
import {useInAppLoadingTasks} from './utils/inAppLoadingTasks/useInAppLoadingTasks'
import {setLastTimeAppWasRunningToNow} from './utils/lastTimeAppWasRunning'
import {navigationRef} from './utils/navigation'
import {useAppState} from './utils/useAppState'

function App(): React.ReactElement {
  const theme = useTheme()

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
            fonts: {
              regular: {
                fontFamily: appConfig.fonts.body400.family,
                fontWeight: '400',
              },
              medium: {
                fontFamily: appConfig.fonts.body500.family,
                fontWeight: '500',
              },
              bold: {
                fontFamily: appConfig.fonts.body600.family,
                fontWeight: '600',
              },
              heavy: {
                fontFamily: appConfig.fonts.body700.family,
                fontWeight: '700',
              },
            },
          }}
        >
          <LoadingOverlayProvider>
            <VersionMigrations>
              <PhoneNumberHashBugMigration>
                <OverlayInfoScreen>
                  <GestureHandlerRootView style={{flex: 1}}>
                    <RootNavigation />
                    <InAppLoadingTasksIndicator />
                  </GestureHandlerRootView>
                </OverlayInfoScreen>
              </PhoneNumberHashBugMigration>
            </VersionMigrations>
            <UploadingOfferProgressModal />
          </LoadingOverlayProvider>
          <AreYouSureDialog />
          <ErrorAlert />
          <ToastNotification />
        </NavigationContainer>
      </KeyboardProvider>
    </SafeAreaProvider>
  )
}

export default function _(): React.ReactElement {
  return (
    <ThemeProvider>
      <StatusBar style="light" />
      <AnimatedSplashScreen>
        <App />
      </AnimatedSplashScreen>
    </ThemeProvider>
  )
}

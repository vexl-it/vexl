import {Effect} from 'effect/index'
import * as SplashScreen from 'expo-splash-screen'
import {useEffect, useState} from 'react'
import {AppState, StyleSheet} from 'react-native'
import Animated, {
  BounceOut,
  runOnJS,
  SlideOutLeft,
} from 'react-native-reanimated'
import {getTokens} from 'tamagui'
import {useIsSessionLoaded} from './state/session'
import {loadSession} from './state/session/loadSession'
import {subscribeToGeneralTopic} from './utils/notifications'
import reportError from './utils/reportError'
import useLoadFonts from './utils/useLoadFonts'
import useSetupVersionServiceState from './utils/versionService/useSetupVersionServiceState'

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: getTokens().color.main.val,
  },
  image: {
    height: 865,
    width: 865,
  },
})

void SplashScreen.preventAutoHideAsync().catch((e) => {
  if (
    AppState.currentState !== 'active' &&
    e instanceof Error &&
    e.message ===
      "No native splash screen registered for given view controller. Call 'SplashScreen.show' for given view controller first."
  ) {
    return
  }
  reportError('error', e, {currentState: AppState.currentState})
})

function AnimatedSplashScreen({
  children,
}: {
  children: React.ReactNode
}): JSX.Element | null {
  const [isAppReady, setIsAppReady] = useState(false)
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] =
    useState(false)
  const [fontsLoaded] = useLoadFonts()
  const sessionLoaded = useIsSessionLoaded()
  useSetupVersionServiceState()

  useEffect(() => {
    void Effect.runFork(loadSession({forceReload: true, showErrorAlert: true}))
    void subscribeToGeneralTopic()
  }, [])

  useEffect(() => {
    // Fallback to hide splash screen after 5 seconds
    const id = setTimeout(() => {
      if (!isAppReady) {
        reportError('warn', new Error('App is taking too long to load'))
        return
      }

      setIsSplashAnimationComplete((prev) => {
        if (!prev)
          reportError(
            'warn',
            new Error(
              'Splash screen animation did not complete even after 5s. Hiding it anyway to avoid blocking the user from using the app.'
            ),
            {isAppReady}
          )
        return true
      })
    }, 5000)
    return () => {
      clearTimeout(id)
    }
  }, [setIsSplashAnimationComplete, isAppReady])

  useEffect(() => {
    if (fontsLoaded && sessionLoaded) {
      setIsAppReady(true)
    }
  }, [fontsLoaded, sessionLoaded])

  useEffect(() => {
    void SplashScreen.hideAsync()
  }, [])

  return (
    <>
      {!isSplashAnimationComplete && (
        <Animated.View
          style={styles.container}
          exiting={SlideOutLeft.duration(400)}
        >
          <Animated.Image
            style={styles.image}
            resizeMode="contain"
            entering={BounceOut.duration(1000).withCallback((finished) => {
              runOnJS(setIsSplashAnimationComplete)(finished)
            })}
            source={require('../assets/splash.png')}
          />
        </Animated.View>
      )}
      {!!isAppReady && <>{children}</>}
    </>
  )
}

export default AnimatedSplashScreen

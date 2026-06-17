import {vexlFonts} from '@vexl-next/ui'
import {Effect} from 'effect/index'
import {useFonts} from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import React, {useCallback, useEffect, useState} from 'react'
import {AppState, StyleSheet} from 'react-native'
import Animated, {BounceOut, SlideOutLeft} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'
import {getTokens} from 'tamagui'
import {SessionRecoveryScreen} from './components/SessionRecoveryScreen'
import {useIsSessionLoaded} from './state/session'
import {loadSession, type LoadSessionResult} from './state/session/loadSession'
import {subscribeToGeneralTopic} from './utils/notifications'
import reportError, {reportErrorE} from './utils/reportError'
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
    backgroundColor: getTokens().color.yellow100.val,
  },
  image: {
    width: 290,
    height: 90,
  },
})

const SESSION_LOAD_RETRY_DELAY_MS = 2_000

function loadSessionOnceForSplashScreen(): Effect.Effect<LoadSessionResult> {
  return loadSession({
    forceReload: true,
    showErrorAlert: false,
  })
}

function loadSessionForSplashScreen(): Effect.Effect<LoadSessionResult> {
  return loadSessionOnceForSplashScreen().pipe(
    Effect.flatMap((firstLoadResult) => {
      if (firstLoadResult.sessionLoaded) return Effect.succeed(firstLoadResult)

      return Effect.zipRight(
        reportErrorE(
          'info',
          new Error(
            'Session not loaded on first attempt. Retrying after delay. This is a fallback and should not happen'
          )
        ),
        Effect.sleep(SESSION_LOAD_RETRY_DELAY_MS)
      ).pipe(
        Effect.zipRight(loadSessionOnceForSplashScreen()),
        Effect.tap((secondLoadResult) => {
          if (secondLoadResult.sessionLoaded)
            return reportErrorE(
              'info',
              new Error('Session login attempt succeeded')
            )
          if (
            !secondLoadResult.sessionLoaded &&
            secondLoadResult.blockingRecoveryRequired
          ) {
            return Effect.succeed(undefined)
          }
          return reportErrorE(
            'error',
            new Error('Session login attempt failed after retry')
          )
        })
      )
    })
  )
}

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
}): React.ReactElement | null {
  const [isAppReady, setIsAppReady] = useState(false)
  const [sessionLoadFinished, setSessionLoadFinished] = useState(false)
  const [blockingRecoveryRequired, setBlockingRecoveryRequired] =
    useState(false)
  const [isReloadingSession, setIsReloadingSession] = useState(false)
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] =
    useState(false)
  const [fontsLoaded] = useFonts(vexlFonts)
  const sessionLoaded = useIsSessionLoaded()
  useSetupVersionServiceState()

  const reloadSessionFromRecoveryScreen = useCallback(() => {
    setIsReloadingSession(true)
    Effect.runFork(
      // Recovery screen reloads are one-shot; only the initial splash load owns
      // the delayed retry.
      loadSessionOnceForSplashScreen().pipe(
        Effect.tap((sessionLoadResult) => {
          if (!sessionLoadResult.sessionLoaded) return Effect.succeed(undefined)

          return reportErrorE(
            'info',
            new Error('Blocking session recovery reload succeeded')
          )
        }),
        Effect.tap((sessionLoadResult) =>
          Effect.sync(() => {
            setBlockingRecoveryRequired(
              !sessionLoadResult.sessionLoaded &&
                sessionLoadResult.blockingRecoveryRequired
            )
            setSessionLoadFinished(true)
          })
        ),
        Effect.ensuring(
          Effect.sync(() => {
            setIsReloadingSession(false)
          })
        )
      )
    )
  }, [])

  useEffect(() => {
    Effect.runFork(
      loadSessionForSplashScreen().pipe(
        Effect.tap((sessionLoadResult) =>
          Effect.sync(() => {
            setBlockingRecoveryRequired(
              !sessionLoadResult.sessionLoaded &&
                sessionLoadResult.blockingRecoveryRequired
            )
          })
        ),
        Effect.ensuring(
          Effect.sync(() => {
            setSessionLoadFinished(true)
          })
        )
      )
    )
    void subscribeToGeneralTopic()
  }, [])

  useEffect(() => {
    // Fallback to hide splash screen after 5 seconds
    const id = setTimeout(() => {
      if (blockingRecoveryRequired) return

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
  }, [blockingRecoveryRequired, setIsSplashAnimationComplete, isAppReady])

  useEffect(() => {
    // `sessionLoaded` becomes true even after the first failed attempt sets
    // `loggedOut`; wait for the splash retry sequence to finish as well.
    if (
      fontsLoaded &&
      sessionLoaded &&
      sessionLoadFinished &&
      !blockingRecoveryRequired
    ) {
      setIsAppReady(true)
    }
  }, [
    blockingRecoveryRequired,
    fontsLoaded,
    sessionLoaded,
    sessionLoadFinished,
  ])

  useEffect(() => {
    void SplashScreen.hideAsync()
  }, [])

  return (
    <>
      {!!blockingRecoveryRequired && (
        <SessionRecoveryScreen
          isReloadingSession={isReloadingSession}
          onReloadSession={reloadSessionFromRecoveryScreen}
        />
      )}
      {!blockingRecoveryRequired && !isSplashAnimationComplete && (
        <Animated.View
          style={styles.container}
          exiting={SlideOutLeft.duration(400)}
        >
          <Animated.Image
            style={styles.image}
            resizeMode="contain"
            entering={BounceOut.duration(1000).withCallback((finished) => {
              scheduleOnRN(setIsSplashAnimationComplete, finished)
            })}
            source={require('./images/sunglasses.png')}
          />
        </Animated.View>
      )}
      {!!isAppReady && !blockingRecoveryRequired && <>{children}</>}
    </>
  )
}

export default AnimatedSplashScreen

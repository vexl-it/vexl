import {useNavigation} from '@react-navigation/native'
import {useCallback, useEffect} from 'react'
import {useIsPostLoginFinished} from '../../state/postLoginOnboarding'
import {useIsUserLoggedIn} from '../../state/session'
import {navigationRef} from '../../utils/navigation'
import {areNotificationsEnabled} from '../../utils/notifications'
import {useAppState} from '../../utils/useAppState'
import useSafeGoBack from '../../utils/useSafeGoBack'

export function useHandlePostLoginFlowRedirect(): void {
  const isLoggedIn = useIsUserLoggedIn()
  const isOnPostLoginFlow = navigationRef.isReady()
    ? navigationRef.getState().routes[0]?.name === 'PostLoginFlow'
    : false
  const isPostLoginFinished = useIsPostLoginFinished()

  useEffect(() => {
    if (!isLoggedIn) return

    if (!isPostLoginFinished && !isOnPostLoginFlow && navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{name: 'PostLoginFlow'}],
      })
    } else if (
      isPostLoginFinished &&
      isOnPostLoginFlow &&
      navigationRef.isReady()
    ) {
      navigationRef.reset({
        index: 0,
        routes: [{name: 'InsideTabs'}],
      })
    }
  }, [isLoggedIn, isPostLoginFinished, isOnPostLoginFlow])
}

export function useHandleNotificationsPermissionsRedirect(): void {
  const safeGoBack = useSafeGoBack()
  // ⚠️⚠️
  // careful when using this hook, this should be user inside Navigator components only
  // at least on Android it can crash the app
  // ⚠️⚠️
  const navigation = useNavigation()
  const isLoggedIn = useIsUserLoggedIn()
  const isPostLoginFinished = useIsPostLoginFinished()

  useAppState(
    useCallback(
      (status) => {
        if (!isLoggedIn) return
        const isOnNotificationPermissionsMissing =
          navigation.getState()?.routes.at(-1)?.name ===
          'NotificationPermissionsMissing'
        const isOnPostLoginFlow =
          navigation.getState()?.routes.at(0)?.name === 'PostLoginFlow'

        if (status === 'active')
          void areNotificationsEnabled()().then((result) => {
            if (result._tag === 'Left') {
              return
            }
            if (isOnPostLoginFlow || !isPostLoginFinished) return

            if (
              !isOnNotificationPermissionsMissing &&
              !result.right.notifications
            ) {
              navigation.navigate('NotificationPermissionsMissing')
            } else if (
              isOnNotificationPermissionsMissing &&
              result.right.notifications
            ) {
              safeGoBack()
            }
          })
      },
      [isLoggedIn, isPostLoginFinished, navigation, safeGoBack]
    )
  )
}

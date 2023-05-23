import {useIsUserLoggedIn} from '../../state/session'
import {useNavigation, useNavigationState} from '@react-navigation/native'
import {useIsPostLoginFinished} from '../../state/postLoginOnboarding'
import {useCallback, useEffect} from 'react'
import {areNotificationsEnabled} from '../../utils/notifications'
import {useAppState} from '../../utils/useAppState'
import useSafeGoBack from '../../utils/useSafeGoBack'

export function useHandlePostLoginFlowRedirect(): void {
  const isLoggedIn = useIsUserLoggedIn()
  const navigation = useNavigation()
  const isOnPostLoginFlow = useNavigationState(
    useCallback((state) => state?.routes[0]?.name === 'PostLoginFlow', [])
  )
  const isPostLoginFinished = useIsPostLoginFinished()

  useEffect(() => {
    if (!isLoggedIn) return

    if (!isPostLoginFinished && !isOnPostLoginFlow) {
      navigation.reset({
        index: 0,
        routes: [{name: 'PostLoginFlow'}],
      })
    } else if (isPostLoginFinished && isOnPostLoginFlow) {
      navigation.reset({
        index: 0,
        routes: [{name: 'InsideTabs'}],
      })
    }
  }, [navigation, isLoggedIn, isPostLoginFinished, isOnPostLoginFlow])
}

export function useHandleNotificationsPermissionsRedirect(): void {
  const safeGoBack = useSafeGoBack()
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

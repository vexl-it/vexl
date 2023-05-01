import {useIsUserLoggedIn} from '../../state/session'
import {useNavigation, useNavigationState} from '@react-navigation/native'
import {useIsPostLoginFinished} from '../../state/postLoginOnboarding'
import {useCallback, useEffect} from 'react'
import {areNotificationsEnabled} from '../../utils/notifications'
import {useAppState} from '../../utils/useAppState'

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
  const navigation = useNavigation()
  const isLoggedIn = useIsUserLoggedIn()

  const isOnPostLoginFlow = useNavigationState(
    useCallback((state) => state?.routes.at(0)?.name === 'PostLoginFlow', [])
  )

  const isOnNotificationPermissionsMissing = useNavigationState(
    useCallback(
      (state) =>
        state?.routes.at(-1)?.name === 'NotificationPermissionsMissing',
      []
    )
  )

  useAppState(
    useCallback(
      (status) => {
        if (!isLoggedIn) return

        if (status === 'active')
          void areNotificationsEnabled()().then((result) => {
            if (result._tag === 'Left') {
              return
            }
            if (isOnPostLoginFlow) return

            if (
              !isOnNotificationPermissionsMissing &&
              !result.right.notifications
            ) {
              navigation.navigate('NotificationPermissionsMissing')
            } else if (
              isOnNotificationPermissionsMissing &&
              result.right.notifications
            ) {
              navigation.canGoBack()
                ? navigation.goBack()
                : navigation.navigate('InsideTabs', {screen: 'Marketplace'})
            }
          })
      },
      [
        isLoggedIn,
        isOnPostLoginFlow,
        navigation,
        isOnNotificationPermissionsMissing,
      ]
    )
  )
}

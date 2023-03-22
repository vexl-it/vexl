import {useIsUserLoggedIn} from '../../state/session'
import {useNavigation, useNavigationState} from '@react-navigation/native'
import {useIsPostLoginFinished} from '../../state/postLoginOnboarding'
import {useEffect} from 'react'

export function useHandlePostLoginFlowRedirect(): void {
  const isLoggedIn = useIsUserLoggedIn()
  const navigation = useNavigation()
  const isOnPostLoginFlow = useNavigationState(
    (state) => state?.routes[0]?.name === 'PostLoginFlow'
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
        routes: [{name: 'HomeTabs'}],
      })
    }
  }, [navigation, isLoggedIn, isPostLoginFinished, isOnPostLoginFlow])
}

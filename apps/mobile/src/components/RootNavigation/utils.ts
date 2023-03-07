import {useIsUserLoggedIn} from '../../state/session'
import {useNavigation, useNavigationState} from '@react-navigation/native'
import {useIsPostLoginFinished} from '../../state/postLoginOnboarding'
import {useEffect} from 'react'
import * as O from 'fp-ts/Option'

export function useHandlePostLoginFlowRedirect(): void {
  const isLoggedIn = useIsUserLoggedIn()
  const navigation = useNavigation()
  const isOnPostLoginFlow = useNavigationState(
    (state) => state?.routes[0]?.name === 'PostLoginFlow'
  )
  const isPostLoginFinished = useIsPostLoginFinished()

  useEffect(() => {
    if (isLoggedIn && O.isSome(isPostLoginFinished)) {
      if (!isPostLoginFinished.value && !isOnPostLoginFlow) {
        navigation.reset({
          index: 0,
          routes: [{name: 'PostLoginFlow'}],
        })
      } else if (isPostLoginFinished.value && isOnPostLoginFlow) {
        navigation.reset({
          index: 0,
          routes: [{name: 'InsideTabs'}],
        })
      }
    }
  }, [navigation, isLoggedIn, isPostLoginFinished, isOnPostLoginFlow])
}

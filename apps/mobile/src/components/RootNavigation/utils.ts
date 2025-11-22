import {useEffect} from 'react'
import {useIsPostLoginFinished} from '../../state/postLoginOnboarding'
import {useIsUserLoggedIn} from '../../state/session'
import {navigationRef} from '../../utils/navigation'

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

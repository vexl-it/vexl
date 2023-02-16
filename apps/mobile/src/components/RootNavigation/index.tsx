import InsideScreen from '../InsideRouter'
import LoginFlow from '../LoginFlow'
import {useIsUserLoggedIn} from '../../state/session'

function RootNavigation(): JSX.Element {
  const isLoggedIn = useIsUserLoggedIn()

  if (!isLoggedIn) {
    return <LoginFlow />
  } else {
    return <InsideScreen />
  }
}

export default RootNavigation

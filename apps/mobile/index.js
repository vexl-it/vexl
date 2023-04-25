import './src/utils/wdyr'
import {registerRootComponent} from 'expo'
import App from './src/App'
import {setupBackgroundMessaging} from './src/utils/notifications/backgroundHandler'

// polyfill Array.at() function
if (![].at) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.at = function (pos) {
    return this.slice(pos)[0]
  }
}

setupBackgroundMessaging()

// eslint-disable-next-line react/prop-types
function HeadlessCheck({isHeadless}) {
  if (isHeadless) return null

  return <App />
}

registerRootComponent(HeadlessCheck)

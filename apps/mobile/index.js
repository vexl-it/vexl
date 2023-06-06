// import './src/utils/wdyr'

// INITIAL SETUP - KEEP THIS AT THE TOP
import './src/components/AppLogsScreen/setupAppLogs'
import './src/utils/setupCryptoImplementation'
import './src/utils/notifications/backgroundHandler'
// INITIAL SETUP DONE

import {registerRootComponent} from 'expo'
import App from './src/App'

// polyfill Array.at() function
if (![].at) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.at = function (pos) {
    return this.slice(pos)[0]
  }
}

// eslint-disable-next-line react/prop-types
function HeadlessCheck({isHeadless}) {
  if (isHeadless) {
    return null
  }

  return <App />
}

registerRootComponent(HeadlessCheck)

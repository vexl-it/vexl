// import './src/utils/wdyr'
import './src/components/AppLogsScreen/setupAppLogs' // setup logs as the first thing
import {registerRootComponent} from 'expo'
import App from './src/App'
import {setupBackgroundMessaging} from './src/utils/notifications/backgroundHandler'
import {
  defaultImplementation,
  setEcdhComputeSecretImplementation,
} from '@vexl-next/cryptography/dist/implementations/ecdhComputeSecret'
import {Platform} from 'react-native'
import {computeSharedSecret} from '@vexl-next/react-native-ecdh-platform-native-utils/src'

// polyfill Array.at() function
if (![].at) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.at = function (pos) {
    return this.slice(pos)[0]
  }
}

setEcdhComputeSecretImplementation(
  Platform.OS === 'ios' ? defaultImplementation : computeSharedSecret
)

setupBackgroundMessaging()

// eslint-disable-next-line react/prop-types
function HeadlessCheck({isHeadless}) {
  if (isHeadless) {
    return null
  }

  return <App />
}

registerRootComponent(HeadlessCheck)

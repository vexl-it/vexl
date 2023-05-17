import './src/utils/wdyr'
import {registerRootComponent} from 'expo'
import App from './src/App'
import {setupBackgroundMessaging} from './src/utils/notifications/backgroundHandler'
import {
  defaultImplementation,
  setEcdhComputeSecretImplementation,
} from '@vexl-next/cryptography/dist/implementations/ecdhComputeSecret'
import {Platform} from 'react-native'
import {computeSharedSecret} from '@vexl-next/react-native-ecdh-platform-native-utils/src'
import {showUINotification} from './src/utils/notifications'

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

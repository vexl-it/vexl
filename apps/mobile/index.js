// import './src/utils/wdyr'
import './globals'
import './src/utils/backgroundTask/defineBackgroundTask'
import './src/utils/notifications/defineBackgroundNotificationTask'
// Registers the global expo-notifications foreground handler. Order matters: it
// must run before any notification can be presented so foreground notifications
// are shown.
import './src/utils/notifications/displayLocalNotification'
import './src/utils/setupCrypto'

import './src/utils/setupSentry'
// INITIAL SETUP - KEEP THIS AT THE TOP
import '@vexl-next/ui/src/config/tamagui.config'
// Order matters
import './src/components/AppLogsScreen/setupAppLogs'
// Order matters
import './src/utils/notifications/backgroundHandler'
// Order matters
import './src/utils/setupCryptoImplementation'
// order matters
import './src/utils/backgroundTask'
// INITIAL SETUP DONE

import * as Sentry from '@sentry/react-native'
import {registerRootComponent} from 'expo'
import App from './src/App'

// polyfill Array.at() function
if (![].at) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.at = function (pos) {
    return this.slice(pos)[0]
  }
}
if (![].toSorted) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.toSorted = function (...arg) {
    return [...this].sort(...arg)
  }
}

registerRootComponent(Sentry.wrap(App))

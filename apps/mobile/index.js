// import './src/utils/wdyr'
import './globals'
import './src/utils/backgroundTask/defineBackgroundTask'
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
import {processBackgroundSocketNotification} from './src/utils/notifications/notificationReceivedHandler'
// Order matters
import './src/utils/setupCryptoImplementation'
// order matters
import './src/utils/backgroundTask'
// Order matters: replaces MapLibre's app-identifying default User-Agent. The
// native registration is dispatched asynchronously on Android, so it has to be
// requested at startup rather than when a map first mounts.
import './src/components/Map/utils/mapRequestUserAgent'
// INITIAL SETUP DONE

import * as Sentry from '@sentry/react-native'
import {BACKGROUND_NOTIFICATION_HEADLESS_TASK} from '@vexl-next/expo-background-notification-socket'
import {registerRootComponent} from 'expo'
import {AppRegistry} from 'react-native'
import App from './src/App'
import {detectMmkvDataLoss} from './src/utils/mmkv/detectMmkvDataLoss'

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

// TODO: Temporary diagnostic for silent MMKV data wipes. Remove with the sentinel.
detectMmkvDataLoss()

AppRegistry.registerHeadlessTask(
  BACKGROUND_NOTIFICATION_HEADLESS_TASK,
  () => processBackgroundSocketNotification
)

registerRootComponent(Sentry.wrap(App))

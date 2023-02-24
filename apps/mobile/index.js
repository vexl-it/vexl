import {registerRootComponent} from 'expo'
import App from './src/App'

// polyfill Array.at() function
if (![].at) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.at = function (pos) {
    return this.slice(pos)[0]
  }
}

registerRootComponent(App)

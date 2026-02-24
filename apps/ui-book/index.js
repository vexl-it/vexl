// Must run before any other imports to suppress the harmless RN DevTools warning
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const {LogBox} = require('react-native')
LogBox.ignoreLogs(['ExceptionsManager should be set up'])

// eslint-disable-next-line import/first
import {registerRootComponent} from 'expo'
// eslint-disable-next-line import/first
import App from './App'

registerRootComponent(App)

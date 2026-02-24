import {LogBox} from 'react-native'

LogBox.ignoreLogs(['ExceptionsManager should be set up'])

import {registerRootComponent} from 'expo'
import App from './App'

registerRootComponent(App)

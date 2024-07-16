import {useEffect} from 'react'
import {LogBox} from 'react-native'
import {LaunchArguments} from 'react-native-launch-arguments'

interface ExpectedLaunchArguments {
  isE2E: boolean
}

function DisableLogBoxForTests(): null {
  useEffect(() => {
    try {
      const isE2E = LaunchArguments.value<ExpectedLaunchArguments>().isE2E
      if (isE2E) {
        // disables yellow box warnings and red box errors
        LogBox.ignoreAllLogs()
      }
    } catch (e) {
      console.error('Error while trying to disable log box for tests', e)
    }
  }, [])

  return null
}

export default DisableLogBoxForTests

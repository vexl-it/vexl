import {useEffect} from 'react'
import BackgroundFetch from 'react-native-background-fetch'
import reportError from '../reportError'
import checkForNewOffers from './checkForNewOffers'

export function BackgroundTaskComponentManager(): null {
  useEffect(() => {
    void BackgroundFetch.configure(
      {
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
        startOnBoot: true,
        minimumFetchInterval: 60 * 24,
        enableHeadless: true,
        stopOnTerminate: false,
      },
      (taskId) => {
        console.info('Running background tasks')
        void Promise.all([checkForNewOffers()])
          .then(() => {
            console.info('Background tasks completed')
          })
          .catch((e) => {
            reportError('error', 'Background tasks failed', e)
          })
          .finally(() => {
            BackgroundFetch.finish(taskId)
          })
      },
      (taskId) => {
        reportError('error', 'Background tasks timed out', null)
        BackgroundFetch.finish(taskId)
      }
    )
  }, [])

  return null
}

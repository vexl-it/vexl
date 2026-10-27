import {Array, Effect} from 'effect/index'
import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import {storage} from '../../utils/mmkv/effectMmkv'

// Written by app versions up to 26.9.5, no longer read since #2124.
const LEGACY_NOTIFICATION_STORAGE_KEYS = [
  'fcmCypherToKeyHolder',
  'notificationServerKey',
  'notificationToken',
]

export const removeLegacyNotificationStorageInAppLoadingTaskId =
  registerInAppLoadingTask({
    name: 'removeLegacyNotificationStorage',
    requirements: {
      requiresUserLoggedIn: false,
      runOn: 'start',
    },
    task: () =>
      Effect.sync(() => {
        Array.forEach(LEGACY_NOTIFICATION_STORAGE_KEYS, (key) => {
          storage._storage.remove(key)
        })
      }),
  })

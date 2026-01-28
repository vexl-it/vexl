import {apiAtom} from '../../api'
import {storage} from '../mmkv/effectMmkv'
import {reportErrorE} from '../reportError'

import {Effect} from 'effect/index'
import {
  InAppLoadingTaskError,
  registerInAppLoadingTask,
} from '../inAppLoadingTasks'
import {getNotificationTokenE} from './index'

const NOTIFICATION_TOKEN_CACHE_KEY = 'notificationToken'

// todo #2124: remove after migrating to vexl notification token
export const refreshNotificationTaskId = registerInAppLoadingTask({
  name: 'refreshNotificationTokenOnResume',
  requirements: {
    requiresUserLoggedIn: true,
    runOn: 'resume',
  },
  task: (store) =>
    Effect.gen(function* (_) {
      const oldToken = storage._storage.getString(NOTIFICATION_TOKEN_CACHE_KEY)
      const newToken = yield* _(getNotificationTokenE())
      if (oldToken === newToken) {
        console.log(
          `Notification token has not changed since the last refresh: ${newToken}`
        )
        return
      }

      if (newToken) storage._storage.set(NOTIFICATION_TOKEN_CACHE_KEY, newToken)
      else storage._storage.delete(NOTIFICATION_TOKEN_CACHE_KEY)

      yield* _(
        store
          .get(apiAtom)
          .contact.updateNotificationToken({body: {expoToken: newToken}}),
        Effect.tapError((e) =>
          reportErrorE(
            'error',
            new Error(
              'Error while refreshing notification token at contact service'
            ),
            {e}
          )
        ),
        Effect.mapError(
          (e) =>
            new InAppLoadingTaskError({
              cause: e,
            })
        )
      )
    }),
})

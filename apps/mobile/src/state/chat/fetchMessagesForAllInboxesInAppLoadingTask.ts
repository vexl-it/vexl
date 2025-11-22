import {Effect} from 'effect/index'
import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import fetchMessagesForAllInboxesAtom from './atoms/fetchNewMessagesActionAtom'

export const fetchMessagesForAllInboxesInAppLoadingTaskId =
  registerInAppLoadingTask({
    name: 'fetchMessagesForAllInboxes',
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'resume',
    },
    task: (store) =>
      Effect.gen(function* (_) {
        store.set(fetchMessagesForAllInboxesAtom)
      }),
  })

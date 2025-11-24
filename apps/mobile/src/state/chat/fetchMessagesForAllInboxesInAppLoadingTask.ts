import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import fetchMessagesForAllInboxesAtom from './atoms/fetchNewMessagesActionAtom'

export const fetchMessagesForAllInboxesInAppLoadingTaskId =
  registerInAppLoadingTask({
    name: 'fetchMessagesForAllInboxes',
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'resume',
    },
    task: (store) => store.set(fetchMessagesForAllInboxesAtom),
  })

import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import {afterRefreshUserUnlessAccountMoved} from '../refreshUserOnContactServiceInAppBackgroundTask'
import fetchMessagesForAllInboxesAtom from './atoms/fetchNewMessagesActionAtom'

export const fetchMessagesForAllInboxesInAppLoadingTaskId =
  registerInAppLoadingTask({
    name: 'fetchMessagesForAllInboxes',
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'resume',
    },
    dependsOn: [afterRefreshUserUnlessAccountMoved],
    task: (store) => store.set(fetchMessagesForAllInboxesAtom),
  })

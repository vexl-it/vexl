import {registerInAppLoadingTask} from '../../../utils/inAppLoadingTasks'
import {fetchVexlProductNotificationsActionAtom} from './vexlProductNotifications'

export const fetchVexlProductNotificationsInAppLoadingTaskId =
  registerInAppLoadingTask({
    name: 'fetchVexlProductNotifications',
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'resume',
    },
    task: (store) => store.set(fetchVexlProductNotificationsActionAtom),
  })

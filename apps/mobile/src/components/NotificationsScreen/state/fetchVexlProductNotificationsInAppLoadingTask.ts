import {registerInAppLoadingTask} from '../../../utils/inAppLoadingTasks'
import {fetchVexlProductNotificationsActionAtom} from './vexlProductNotifications'

export const fetchVexlProductNotificationsInAppLoadingTaskId =
  registerInAppLoadingTask({
    name: 'fetchVexlProductNotifications',
    requirements: {
      requiresUserLoggedIn: true,
      runOn: 'start',
    },
    task: (store) => store.set(fetchVexlProductNotificationsActionAtom),
  })

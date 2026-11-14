import {Effect} from 'effect'
import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import {refreshOffersActionAtom} from '../marketplace/atoms/refreshOffersActionAtom'
import {reconcileQuickOffersActionAtom} from './reconcileQuickOffersActionAtom'

// Retries a failed creation or deletion. Offers are fetched first, so after a
// restore my quick offers are known before anything gets created.
export const reconcileQuickOffersInAppLoadingTaskId = registerInAppLoadingTask({
  name: 'reconcileQuickOffers',
  requirements: {
    requiresUserLoggedIn: true,
    runOn: 'start',
  },
  task: (store) =>
    store
      .set(refreshOffersActionAtom)
      .pipe(Effect.zipRight(store.set(reconcileQuickOffersActionAtom))),
})

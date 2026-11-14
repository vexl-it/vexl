import {Effect} from 'effect'
import {
  FIVE_MINUTES_MS,
  registerInAppLoadingTask,
} from '../../utils/inAppLoadingTasks'
import {checkForClubsAdmissionActionAtom} from '../clubs/atom/checkForClubsAdmissionActionAtom'
import {syncAllClubsHandleStateWhenNotFoundActionAtom} from '../clubs/atom/refreshClubsActionAtom'
import {reconcileQuickOffersActionAtom} from '../quickOffers/reconcileQuickOffersActionAtom'
import {afterRefreshUserUnlessAccountMoved} from '../refreshUserOnContactServiceInAppBackgroundTask'
import {checkUserNeedsToImportContactsAndReencryptOffersActionAtom} from './atom/checkUserNeedsToImportAndReencryptOffersActionAtom'
import {updateAndReencryptAllConnectionsActionAtom} from './atom/updateAndReencryptAllConnectionsActionAtom'

export const syncConnectionsInAppTaskId = registerInAppLoadingTask({
  name: 'syncConnections',
  runAfterOtherTasks: true,
  dependsOn: [afterRefreshUserUnlessAccountMoved],
  requirements: {
    requiresUserLoggedIn: true,
    runOn: 'resume',
    minTimeBetweenRunsMs: FIVE_MINUTES_MS,
  },
  task: (store) =>
    Effect.gen(function* (_) {
      const syncClubs = store.set(syncAllClubsHandleStateWhenNotFoundActionAtom)
      const updateConnections = store.set(
        updateAndReencryptAllConnectionsActionAtom,
        {isInBackground: false}
      )
      const checkForClubAdmissions = store.set(checkForClubsAdmissionActionAtom)
      const checkUserNeedsToImportContactsAndReencryptOffers = store.set(
        checkUserNeedsToImportContactsAndReencryptOffersActionAtom
      )
      // Publishes quick offers that could not be published without connections.
      const reconcileQuickOffers = store.set(reconcileQuickOffersActionAtom)

      yield* _(
        checkForClubAdmissions,
        Effect.andThen(syncClubs),
        Effect.andThen(updateConnections),
        Effect.andThen(reconcileQuickOffers),
        Effect.andThen(checkUserNeedsToImportContactsAndReencryptOffers)
      )
    }),
})

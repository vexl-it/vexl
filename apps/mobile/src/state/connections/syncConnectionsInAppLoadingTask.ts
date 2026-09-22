import {Effect} from 'effect'
import {
  FIVE_MINUTES_MS,
  registerInAppLoadingTask,
} from '../../utils/inAppLoadingTasks'
import {checkForClubsAdmissionActionAtom} from '../clubs/atom/checkForClubsAdmissionActionAtom'
import {syncAllClubsHandleStateWhenNotFoundActionAtom} from '../clubs/atom/refreshClubsActionAtom'
import {checkUserNeedsToImportContactsAndReencryptOffersActionAtom} from './atom/checkUserNeedsToImportAndReencryptOffersActionAtom'
import {updateAndReencryptAllConnectionsActionAtom} from './atom/updateAndReencryptAllConnectionsActionAtom'

export const syncConnectionsInAppTaskId = registerInAppLoadingTask({
  name: 'syncConnections',
  runAfterOtherTasks: true,
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

      yield* _(
        checkForClubAdmissions,
        Effect.andThen(syncClubs),
        Effect.andThen(updateConnections),
        Effect.andThen(checkUserNeedsToImportContactsAndReencryptOffers)
      )
    }),
})

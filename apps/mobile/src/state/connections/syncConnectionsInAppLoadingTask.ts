import {Effect} from 'effect'
import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import {checkForClubsAdmissionActionAtom} from '../clubs/atom/checkForClubsAdmissionActionAtom'
import {syncAllClubsHandleStateWhenNotFoundActionAtom} from '../clubs/atom/refreshClubsActionAtom'
import {checkUserNeedsToImportContactsAndReencryptOffersActionAtom} from './atom/checkUserNeedsToImportAndReencryptOffersActionAtom'
import {syncConnectionsActionAtom} from './atom/connectionStateAtom'
import {updateAndReencryptAllOffersConnectionsActionAtom} from './atom/offerToConnectionsAtom'

export const syncConnectionsInAppTaskId = registerInAppLoadingTask({
  name: 'syncConnections',
  requirements: {
    requiresUserLoggedIn: true,
    runOn: 'resume',
  },
  task: (store) =>
    Effect.gen(function* (_) {
      const syncConnections = store.set(syncConnectionsActionAtom)
      const syncClubs = store.set(syncAllClubsHandleStateWhenNotFoundActionAtom)
      const updateOffers = store.set(
        updateAndReencryptAllOffersConnectionsActionAtom,
        {isInBackground: false}
      )
      const checkForClubAdmissions = store.set(checkForClubsAdmissionActionAtom)
      const checkUserNeedsToImportContactsAndReencryptOffers = store.set(
        checkUserNeedsToImportContactsAndReencryptOffersActionAtom
      )

      yield* _(
        syncConnections,
        Effect.andThen(checkUserNeedsToImportContactsAndReencryptOffers),
        Effect.andThen(checkForClubAdmissions),
        Effect.andThen(syncClubs),
        Effect.andThen(updateOffers)
      )
    }),
})

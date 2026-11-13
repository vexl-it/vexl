import {Effect} from 'effect'
import {
  InAppLoadingTaskError,
  registerInAppLoadingTask,
} from '../../utils/inAppLoadingTasks'
import {reencryptOffersMissingOnServerActionAtom} from '../marketplace/atoms/offersMissingOnServer'
import {rebuildRestoredOffersAndNotesActionAtom} from './rebuildRestoredOffersAndNotes'

// Retries a rebuild the contacts import screen could not finish.
registerInAppLoadingTask({
  name: 'rebuildRestoredOffersAndNotes',
  requirements: {
    requiresUserLoggedIn: true,
    runOn: 'resume',
  },
  task: (store) =>
    store
      .set(rebuildRestoredOffersAndNotesActionAtom, (offers) =>
        store.set(reencryptOffersMissingOnServerActionAtom, {offers})
      )
      .pipe(
        Effect.asVoid,
        Effect.mapError((cause) => new InAppLoadingTaskError({cause}))
      ),
})

import {Effect} from 'effect'
import {atom, type ExtractAtomArgs} from 'jotai'
import {fetchConnectionsActionAtom} from './connectionStateAtom'
import {updateAndReencryptAllNotesConnectionsActionAtom} from './noteToConnectionsAtom'
import {updateAndReencryptAllOffersConnectionsActionAtom} from './offerToConnectionsAtom'

type OffersParams = ExtractAtomArgs<
  typeof updateAndReencryptAllOffersConnectionsActionAtom
>[0]
type NotesParams = ExtractAtomArgs<
  typeof updateAndReencryptAllNotesConnectionsActionAtom
>[0]

// Offers and notes keep separate baselines and locks but share one fetch.
export const updateAndReencryptAllConnectionsActionAtom = atom(
  null,
  (
    get,
    set,
    {
      isInBackground,
      onOfferProgress,
      onNoteProgress,
    }: {
      isInBackground?: boolean
      onOfferProgress?: OffersParams['onProgres']
      onNoteProgress?: NotesParams['onProgres']
    }
  ): Effect.Effect<void> =>
    Effect.gen(function* (_) {
      const fetchedConnections = yield* _(
        set(fetchConnectionsActionAtom),
        Effect.option
      )
      yield* _(
        set(updateAndReencryptAllOffersConnectionsActionAtom, {
          isInBackground,
          onProgres: onOfferProgress,
          fetchedConnections,
        })
      )
      yield* _(
        set(updateAndReencryptAllNotesConnectionsActionAtom, {
          isInBackground,
          onProgres: onNoteProgress,
          fetchedConnections,
        })
      )
    })
)

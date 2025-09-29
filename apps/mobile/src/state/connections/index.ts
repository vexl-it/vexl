import {Effect, pipe} from 'effect'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {useAppState} from '../../utils/useAppState'
import {checkForClubsAdmissionActionAtom} from '../clubs/atom/checkForClubsAdmissionActionAtom'
import {syncAllClubsHandleStateWhenNotFoundActionAtom} from '../clubs/atom/refreshClubsActionAtom'
import {checkUserNeedsToImportContactsAndReencryptOffersActionAtom} from './atom/checkUserNeedsToImportAndReencryptOffersActionAtom'
import {syncConnectionsActionAtom} from './atom/connectionStateAtom'
import {updateAndReencryptAllOffersConnectionsActionAtom} from './atom/offerToConnectionsAtom'

export function useSyncConnections(): void {
  const syncConnections = useSetAtom(syncConnectionsActionAtom)
  const syncClubs = useSetAtom(syncAllClubsHandleStateWhenNotFoundActionAtom)
  const updateOffers = useSetAtom(
    updateAndReencryptAllOffersConnectionsActionAtom
  )
  const checkForClubAdmissions = useSetAtom(checkForClubsAdmissionActionAtom)
  const checkUserNeedsToImportContactsAndReencryptOffers = useSetAtom(
    checkUserNeedsToImportContactsAndReencryptOffersActionAtom
  )

  useAppState(
    useCallback(
      (state) => {
        if (state !== 'active') return
        pipe(
          syncConnections(),
          Effect.andThen(() =>
            checkUserNeedsToImportContactsAndReencryptOffers()
          ),
          Effect.andThen(() => checkForClubAdmissions()),
          Effect.andThen(() => syncClubs()),
          Effect.andThen(() => updateOffers({isInBackground: false})),
          Effect.runFork
        )
      },
      [
        checkForClubAdmissions,
        checkUserNeedsToImportContactsAndReencryptOffers,
        syncClubs,
        syncConnections,
        updateOffers,
      ]
    )
  )
}

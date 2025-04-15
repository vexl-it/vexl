import {taskToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect, pipe} from 'effect'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {useAppState} from '../../utils/useAppState'
import {checkForClubsAdmissionActionAtom} from '../clubs/atom/checkForClubsAdmissionActionAtom'
import {clubsWithMembersAtom} from '../clubs/atom/clubsWithMembersAtom'
import {syncConnectionsActionAtom} from './atom/connectionStateAtom'
import {updateAllOffersConnectionsActionAtom} from './atom/offerToConnectionsAtom'

export function useSyncConnections(): void {
  const syncConnections = useSetAtom(syncConnectionsActionAtom)
  const syncClubsConnections = useSetAtom(clubsWithMembersAtom)
  const updateOffers = useSetAtom(updateAllOffersConnectionsActionAtom)
  const checkForClubAdmissions = useSetAtom(checkForClubsAdmissionActionAtom)

  useAppState(
    useCallback(
      (state) => {
        if (state !== 'active') return
        pipe(
          syncConnections(),
          Effect.andThen(() => checkForClubAdmissions()),
          Effect.andThen(() => syncClubsConnections()),
          Effect.andThen(() =>
            taskToEffect(updateOffers({isInBackground: false}))
          ),
          Effect.runFork
        )
      },
      [
        checkForClubAdmissions,
        syncClubsConnections,
        syncConnections,
        updateOffers,
      ]
    )
  )
}

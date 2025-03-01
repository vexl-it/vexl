import {taskToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect, pipe} from 'effect'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {clubsWithMembersAtom} from '../../components/CRUDOfferFlow/atoms/clubsWithMembersAtom'
import {useAppState} from '../../utils/useAppState'
import {syncConnectionsActionAtom} from './atom/connectionStateAtom'
import {updateAllOffersConnectionsActionAtom} from './atom/offerToConnectionsAtom'

export function useSyncConnections(): void {
  const syncConnections = useSetAtom(syncConnectionsActionAtom)
  const syncClubsConnections = useSetAtom(clubsWithMembersAtom)
  const updateOffers = useSetAtom(updateAllOffersConnectionsActionAtom)

  useAppState(
    useCallback(
      (state) => {
        if (state !== 'active') return
        pipe(
          syncConnections(),
          Effect.andThen(syncClubsConnections()),
          Effect.andThen(taskToEffect(updateOffers({isInBackground: false}))),
          Effect.runFork
        )
      },
      [syncClubsConnections, syncConnections, updateOffers]
    )
  )
}
